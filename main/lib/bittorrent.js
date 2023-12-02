'use strict';

const path = require('path');
const bencode = require('bencode')
const sha1 = require('simple-sha1');

const utils = require('./utils');

let parseFileInfo = function (file, torrentName, offset) {
    const parts = [].concat(torrentName, file['path.utf-8'] || file.path || []).map(p => p.toString());

    return {
        path: path.join.apply(null, [path.sep].concat(parts)).slice(1),
        name: parts[parts.length - 1],
        length: file.length,
        offset: offset
    };
}

let parseBittorrentInfo = function (base64TorrentData) {
    try {
        const torrentData = Buffer.from(base64TorrentData, 'base64');
        const torrentInfo = bencode.decode(torrentData);

        // reference: https://github.com/webtorrent/parse-torrent/blob/v9.1.5/index.js
        if (!torrentInfo ||
            !torrentInfo.info ||
            (!torrentInfo.info['name.utf-8'] && !torrentInfo.info.name) ||
            !torrentInfo.info['piece length'] ||
            !torrentInfo.info.pieces) {
            return null;
        }

        const result = {
            name: (torrentInfo.info['name.utf-8'] || torrentInfo.info.name).toString(),
            infoHash: sha1.sync(bencode.encode(torrentInfo.info)),
            pieceLength: torrentInfo.info['piece length']
        };

        const files = [];
        let currentOffset = 0;

        if (utils.isArray(torrentInfo.info.files) && torrentInfo.info.files.length) {
            for (let i = 0; i < torrentInfo.info.files.length; i++) {
                const file = torrentInfo.info.files[i];

                if (!utils.isNumber(file.length) || (!file['path.utf-8'] && !file.path)) {
                    return null;
                }

                files.push(parseFileInfo(file, result.name, currentOffset));
                currentOffset += file.length;
            }
        } else if (torrentInfo.info.length && utils.isNumber(torrentInfo.info.length)) {
            files.push(parseFileInfo(torrentInfo.info, result.name, currentOffset));
            currentOffset = torrentInfo.info.length;
        } else {
            return null;
        }

        result.files = files;
        result.length = currentOffset;

        if (torrentInfo.info.private !== undefined) {
            result.private = !!torrentInfo.info.private;
        }

        if (torrentInfo['creation date']) {
            result.created = new Date(torrentInfo['creation date'] * 1000);
        }

        if (Buffer.isBuffer(torrentInfo['comment.utf-8'])) {
            result.comment = torrentInfo['comment.utf-8'].toString();
        } else if (Buffer.isBuffer(torrentInfo.comment)) {
            result.comment = torrentInfo.comment.toString();
        }

        if (utils.isArray(torrentInfo['announce-list']) && torrentInfo['announce-list'].length) {
            const announce = new Set();
            torrentInfo['announce-list'].forEach(urls => {
                urls.forEach(url => {
                    announce.add(url.toString());
                });
            });
            result.announce = Array.from(announce);
        } else if (torrentInfo.announce) {
            result.announce = [torrentInfo.announce.toString()];
        }

        return result;
    } catch (ex) {
        return null;
    }
};

module.exports = {
    parseBittorrentInfo: parseBittorrentInfo
};
