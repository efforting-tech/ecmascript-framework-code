
report: all
	ls ../test-report/*.json | node ../framework/collate-reports.js

all: test

test: $(patsubst %.js,../test-report/%.json,$(wildcard test-*.js))

../test-report/%.json: %.js
	node ../framework/testing.js -O $@ node $<



.PHONY: all test