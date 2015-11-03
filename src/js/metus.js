var autocomplete = null;
var API_KEY = '2f704255546692a276e43714259';

// Require custom meetup functionality (in meetup.js)
var MeetupGroup = require('./meetup');
// Include a few external libraries
var Chartist = require('chartist');
var Awesomplete = require('awesomplete');
var moment = require('moment');

// Chartist.plugins.ctAxisTitle = require('chartist-plugin-axistitle');

// AJAX support on Awesomplete; significant inspiration from 
//      https://github.com/LeaVerou/awesomplete/
var evaluateList = Awesomplete.prototype.evaluate;
Awesomplete.prototype.evaluate = function () {
    if (this.ajaxUrl) {
        this.ajaxLoad().success(this.ajaxParse.bind(this));
    }

    evaluateList.call(this);
};

Awesomplete.prototype.ajaxLoad = function () {
    return $.ajax(this.ajaxUrl, {
        method: 'GET',
        dataType: 'jsonp',
        data: {
            key: API_KEY,
            text: this.input.value,
        },
    });
};

Awesomplete.prototype.ajaxParse = function (response) {
    this._list.length = 0;
    this.table = {};
    for (var i = 0; i < Math.min(response.data.length, 10); i++) {
        // Save the full object for rendering the dropdown element later.
        this.table[response.data[i].name] = response.data[i];

        if (this._list.indexOf(response.data[i].name) === -1) {
            this._list.push(response.data[i].name);
        }
    }

    evaluateList.call(this);
};

/**
 * This function should be invoked by the MeetupGroup object whenever the core data structures
 * change.
 */
MeetupGroup.prototype._update = function () {
    render(this);
};

window.addEventListener('awesomplete-selectcomplete', function () {
    // Look up information about this group.
    var group = autocomplete.table[$('#who').val()];

    // Add a hash and create a new MeetupGroup
    window.location.hash = '#' + group.urlname;
    new MeetupGroup(group.urlname).onload = function () {
        render(this);
        $('#graph').removeClass('inactive');
    };
});

// Initialization function. Set up the chart.
window.addEventListener('load', function () {
    autocomplete = new Awesomplete(document.getElementById('who'), {
        list: '#data',

        // Generate the element that should be shown for each drop-down.
        item: function (sugg, provided) {
            var group = this.table[sugg];
            var img_path = 'group_photo' in group ? group.group_photo.thumb_link : '';
            // Create a new <li> and fetch the HTML Node from the jquery obj.
            return $("<li/>", {
                    class: 'ac-option',
                    'aria-selected': 'false',
                })
                .append($('<img/>', {
                    src: img_path,
                }))
                .append($('<div/>', {
                        class: 'ac-option-body',
                    })
                    .append($('<h2/>', {
                        text: sugg
                    }))
                    .append($('<p/>', {
                        text: '\t' + [
                            group.members + " members",
                            group.city + ", " + group.state,
                            "Created on " + moment(group.created).format("MMMM Do, YYYY"),
                        ].join(' - '),
                    }))).get(0);
        },

        // 
        replace: function (text) {
            this.input.value = text.split('\t')[0];
        },
    });
    autocomplete.ajaxUrl = 'https://api.meetup.com/find/groups';

    // If a meetup group was specified in the URL, load it.
    if (window.location.hash) {
        var groupUrl = window.location.hash.substr(1);

        console.log('Loading existing group: ' + groupUrl);
        new MeetupGroup(groupUrl).onload = function () {
            render(this);
            // Make sure there aren't any inactive styles.
            $('#graph').removeClass('inactive');
            $('#who').val(this.info.name);
        };

    } else {
        // Generate a placeholder group with fake data. This will be replaced when
        // a group is specified.
        var group = new MeetupGroup('', false);
        group.info = {
            // 'created' is expected to be a number of seconds, not milliseconds.
            created: Number(moment().subtract(1, 'year').format('X')),
        };

        var gap = moment().diff(moment.unix(group.info.created), 'seconds');
        for (var i = 0; i < 100; i++) {
            group.members.push({
                // Start at the group creation time, and shift by a random increment between the
                // start date and right now.
                joined: Math.round(Number(moment.unix(group.info.created).add(gap * Math.random(), 'seconds').format('X'))),
            });
        }

        render(group);

        // Make it clear the graph is fake.
        $('#graph').addClass('inactive');
    }
});

function render(group) {
    var data = {
        labels: group.labels(), //[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [{
            'name': 'membership',
            'data': group.series(),
        }],
    };

    new Chartist.Line('#graph', data, {
        fullWidth: true,
        low: 0,
        series: {
            'membership': {
                showArea: true,
            }
        },
        axisY: {
            onlyInteger: true,
        },
        /*
        plugins: [
            Chartist.plugins.ctAxisTitle({
                axisX: {},
                axisY: {
                    axisTitle: 'Total members',
                    axisClass: 'ct-axis-title',
                    offset: {
                        x: 0,
                        y: 0,
                    },
                    textAnchor: 'middle',
                },
            }),
        ],
        */
    });
}