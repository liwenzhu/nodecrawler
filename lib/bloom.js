'use strict';

var crypto = require('crypto');

module.exports = Bloom;

function Bloom () {
    this.buckets = [];
};

Bloom.prototype.add = function (data) {
    var md5Value, sha1Value;
    md5Value = md5(data);
    fillBucket(md5Value, this.buckets);
    sha1Value = sha1(data);
    fillBucket(sha1Value, this.buckets);
};

Bloom.prototype.exist = function (data) {
    var md5Value, sha1Value;
    md5Value = md5(data);
    if(!visited(md5Value, this.buckets))
        return false;
    sha1Value = sha1(data);
    if(!visited(sha1Value, this.buckets))
        return false;
    return true;
};

function visited (hashedValue, buckets) {
    var bucketIndex, positionIndex;
    bucketIndex = getBucketIndex(hashedValue);
    positionIndex = getPositionIndex(hashedValue);
    return ( buckets[bucketIndex] & ( 1 << positionIndex ) );
};

function fillBucket (hashedValue, buckets) {
    var bucketIndex, positionIndex;
    bucketIndex = getBucketIndex(hashedValue);
    positionIndex = getPositionIndex(hashedValue);
    buckets[bucketIndex] = buckets[bucketIndex] || 0;
    buckets[bucketIndex] = buckets[bucketIndex] | ( 1 << positionIndex );
};

function getBucketIndex (hashedValue) {
    return hashedValue >>> 5; 
};

function getPositionIndex (hashedValue) {
    return hashedValue & 31;
};

function md5 (data) {
    return crypto.createHash('md5').update(data).digest().readUInt16LE(0);
};

function sha1 (data) {
    return crypto.createHash('sha1').update(data).digest().readUInt32LE(0);
};




