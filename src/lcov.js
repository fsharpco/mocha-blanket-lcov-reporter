/**
 * Map jscoverage data for a single source file
 * to a JSON structure suitable for reporting.
 *
 * @param {String} filename name of the source file
 * @param {Object} data jscoverage coverage data
 * @return {Object}
 * @api private
 */

function coverage(filename, data) {
    var ret = {
        filename: filename,
        coverage: 0,
        hits: 0,
        misses: 0,
        sloc: 0,
        source: {}
    };

    data.source.forEach(function(line, num) {
        num++;

        if (data[num] === 0) {
            ret.misses++;
            ret.sloc++;
        } else if (data[num] !== undefined) {
            ret.hits++;
            ret.sloc++;
        }

        ret.source[num] = {
            source: line,
            coverage: data[num] === undefined ? '' : data[num]
        };
    });

    ret.coverage = ret.hits / ret.sloc * 100;

    return ret;
}

/**
 * Map jscoverage data to a JSON structure
 * suitable for reporting.
 *
 * @param {Object} cov
 * @return {Object}
 * @api private
 */

function map(cov) {
    var ret = {
        instrumentation: 'node-jscoverage',
        sloc: 0,
        hits: 0,
        misses: 0,
        coverage: 0,
        files: []
    };

    for (var filename in cov) {
        var data = coverage(filename, cov[filename]);
        ret.files.push(data);
        ret.hits += data.hits;
        ret.misses += data.misses;
        ret.sloc += data.sloc;
    }

    ret.files.sort(function(a, b) {
        return a.filename.localeCompare(b.filename);
    });

    if (ret.sloc > 0) {
        ret.coverage = (ret.hits / ret.sloc) * 100;
    }

    return ret;
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
 */

function clean(test) {
    return {
        title: test.title,
        fullTitle: test.fullTitle(),
        duration: test.duration
    };
}

function reportFile(filename, data) {
    process.stdout.write('SF:' + filename + '\n');
    Object.keys(data.source).forEach(function(line) {
        process.stdout.write('DA:' + line + ',' + (data.source[line].coverage || 0) + '\n');
    });
    process.stdout.write('LF:' + data.sloc + '\n');
    process.stdout.write('LH:' + data.hits + '\n');
    process.stdout.write('end_of_record\n');
}

function lcov(runner, output) {
    output = 1 === arguments.length ? true : output;

    var self = this,
        tests = [],
        failures = [],
        passes = [];

    runner.on('test end', function(test) {
        tests.push(test);
    });

    runner.on('pass', function(test) {
        passes.push(test);
    });

    runner.on('fail', function(test) {
        failures.push(test);
    });

    runner.on('end', function() {
        var cov = global._$jscoverage || {},
            result = self.cov = map(cov);

        result.stats = self.stats;
        result.tests = tests.map(clean);
        result.failures = failures.map(clean);
        result.passes = passes.map(clean);

        if (!output) {
            return;
        }

        result.files.forEach(function(file) {
            reportFile(file.filename, file);
        });
    });
}

module.exports = lcov;
