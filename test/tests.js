var should = require('chai').should();
var MeetupGroup = require('../src/js/meetup');

describe('MeetupGroup', function () {
    it('should have an empty member array after initialiation', function () {
        var group = new MeetupGroup('', false);

        group.members.should.be.an('array');
        group.members.should.have.length(0);
    });

    it('should have an empty associative array for group info', function () {
        var group = new MeetupGroup('', false);

        group.info.should.be.an('object');
        Object.keys(group.info).should.have.length(0);
    });

    /*
    it('can load Meetup group information successfully', function () {
        
                var group = new MeetupGroup('The-Iron-Yard-Charlotte');
                group.onload = function () {
                    this.info.should.have.property('name');
                };
                group.onerror = function (error) {
                    should.not.exist(error);
                };
    });
    */
});