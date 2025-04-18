
# TODO - remove temporary first target
#current: clean parser-language text-tree-processing templates
current: clean parser-state
	ls ../test-report/*.json | node ../framework/collate-reports.js




report: all
	ls ../test-report/*.json | node ../framework/collate-reports.js

all: clean test switchable-iterator xml-processing

test: $(patsubst %.js,../test-report/%.json,$(wildcard test-*.js))
switchable-iterator: $(patsubst %.js,../test-report/%.json,$(wildcard swit-*.js))
xml-processing: $(patsubst %.js,../test-report/%.json,$(wildcard xml-processing-*.js))
text-tree-processing: $(patsubst %.js,../test-report/%.json,$(wildcard tt-processing-*.js))
templates: $(patsubst %.js,../test-report/%.json,$(wildcard template-*.js))
parser-language: $(patsubst %.js,../test-report/%.json,$(wildcard pl-*.js))
parser-state: $(patsubst %.js,../test-report/%.json,$(wildcard ps-*.js))


clean:
	rm -rf ../test-report/*

../test-report/%.json: %.js
	node ../framework/testing.js -O $@ node $<



.PHONY: all test clean switchable-iterator