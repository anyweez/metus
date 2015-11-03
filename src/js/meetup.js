var moment = require('moment');
var API_KEY = '2f704255546692a276e43714259';

function MeetupGroup(groupUrl, live) {
    live = (live === undefined) ? true : live;

    this.info = {};
    this.members = [];

    // Make some AJAX calls to fetch data.
    if (live) this._loadGroup(groupUrl);
}

// Get the number of buckets that this group should be rendered as. There should
// be at most 20 buckets, but fewer if the group hasn't existed for that long (in
// which case there are NUM_DAYS buckets.
MeetupGroup.prototype.buckets = function () {
    var existingDays = moment().diff(moment.unix(this.info.created), 'days');
    return Math.min(existingDays, 20);
};

// Generate date labels for each bucket.
MeetupGroup.prototype.labels = function () {
    var bSize = (moment().diff(moment.unix(this.info.created), 'seconds')) / this.buckets();
    var data = [];

    for (var i = 0; i < this.buckets(); i++) {
        data[i] = moment.unix(this.info.created + (bSize * i)).format("MMM Do, YYYY");
    }

    return data;
};

// Return a series containing buckets() buckets, where each bucket
// indicates the number of members the group had at the time that the
// bucket indicates.
MeetupGroup.prototype.series = function () {
    var data = [];
    for (var i = 0; i < this.buckets(); i++) {
        data[i] = 0;
    }

    var bucketSize = (Number(moment().format("X")) - this.info.created) / this.buckets();

    var self = this;
    this.members.forEach(function (member) {
        // Find the earliest bucket that the user was a member for. Increment all buckets
        // beyond that point.
        var earliestBucket = Math.ceil((member.joined - self.info.created) / bucketSize) - 1;
        for (var i = earliestBucket; i < data.length; i++) data[i]++;
    });

    return data;
};

/**
 * Load core group information. This includes a bunch of metadata, specified here:
 *      http://www.meetup.com/meetup_api/docs/2/groups/
 * Key bits are name, # of members, created date.
 */
MeetupGroup.prototype._loadGroup = function (groupUrl) {
    var self = this;

    $.ajax("http://api.meetup.com/2/groups", {
        dataType: 'jsonp',
        success: function (response) {
            // Check for errors. If we run into any, about the loading of the
            // group.
            if (!('results' in response)) {
                self.onerror({
                    error: "API error",
                    reason: response.details,
                });

                return false;
            }

            if (!response.results.length) {
                self.onerror({
                    error: "No results found.",
                    reason: "Provided groupUrl didn't return any results.",
                });

                return false;
            }

            self.info = response.results[0];
            // Created timestamp is specified in milliseconds; we need to convert this
            // to seconds.
            self.info.created /= 1000;

            console.log("Loading data for " + self.info.name);
            self._loadMembers();
        },
        data: {
            key: API_KEY,
            group_urlname: groupUrl,
        },
    });
};

/**
 * Load all members. Note that this might take multiple AJAX requests since a
 * single request only returns 200 members. The number of users returned can
 * change depending on the value of the `page` param but performance seems to
 * suffer if many more than 200 are requested at once.
 */
MeetupGroup.prototype._loadMembers = function (offset) {
    var self = this;
    offset = (offset === undefined) ? 0 : offset;

    $.ajax('https://api.meetup.com/2/members', {
        dataType: 'jsonp',
        success: function (data) {
            for (var i = 0; i < data.results.length; i++) {
                // Convert from milliseconds to seconds.
                data.results[i].joined /= 1000;
                self.members.push(data.results[i]);
            }
            console.log("Retrieved " + self.members.length + " users so far.");

            // Members are requested in batches ("pages"); continue to request
            // members until we get all of them.
            if (data.meta.count > 0) {
                self._loadMembers(offset + 1);
            } else {
                // Fully loaded now; called the onload handler.
                self.onload();
            }
        },
        error: function (data) {
            console.log("error!!!");
            console.log(data);
        },
        data: {
            key: API_KEY,
            group_id: self.info.id,
            page: 200, // 200 responses per page (default)
            offset: offset,
        },
    });
};

// Event handlers.
MeetupGroup.prototype.onload = function () {};
MeetupGroup.prototype.onerror = function (error) {
    console.log(error);
};

module.exports = MeetupGroup;