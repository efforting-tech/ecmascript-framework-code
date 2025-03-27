
# TODO - remove temporary first target
#current: clean xml-processing
#	ls ../test-report/*.json | node ../framework/collate-reports.js




report: all
	ls ../test-report/*.json | node ../framework/collate-reports.js

all: clean test switchable-iterator xml-processing

test: $(patsubst %.js,../test-report/%.json,$(wildcard test-*.js))
switchable-iterator: $(patsubst %.js,../test-report/%.json,$(wildcard swit-*.js))
xml-processing: $(patsubst %.js,../test-report/%.json,$(wildcard xml-processing-*.js))

clean:
	rm -rf ../test-report/*

../test-report/%.json: %.js
	node ../framework/testing.js -O $@ node $<



.PHONY: all test clean switchable-iterator