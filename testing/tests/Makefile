#Verbosity options
Q:=@
MAKE_FLAGS:=--no-print-directory

run_all_tests:
	$(Q) $(MAKE) $(MAKE_FLAGS) clean
	$(Q) $(MAKE) $(MAKE_FLAGS) -j report


report: all	#TODO - should be "all" but now we are testing specific things
	$(Q) ls ../test-report/*.json | node ../framework/collate-reports.js

#Excluding "test" from "all" for the moment since we haven't added support for expecting failures and we have expected failures in test
all: ../test-report/tt-processing-basic.json #switchable-iterator xml-processing templates parser text

test: $(patsubst %.js,../test-report/%.json,$(wildcard test-*.js))

switchable-iterator: $(patsubst %.js,../test-report/%.json,$(wildcard swit-*.js))
xml-processing: $(patsubst %.js,../test-report/%.json,$(wildcard xml-processing-*.js))
templates: $(patsubst %.js,../test-report/%.json,$(wildcard template-*.js))

parser: parser-language parser-state
text: indent line-endings text-format line-processing text-tree-processing

line-processing: $(patsubst %.js,../test-report/%.json,$(wildcard lp-*.js))
text-tree-processing: $(patsubst %.js,../test-report/%.json,$(wildcard tt-processing-*.js))

parser-language: $(patsubst %.js,../test-report/%.json,$(wildcard pl-*.js))
parser-state: $(patsubst %.js,../test-report/%.json,$(wildcard ps-*.js))

indent: $(patsubst %.js,../test-report/%.json,$(wildcard indent-*.js))
line-endings: $(patsubst %.js,../test-report/%.json,$(wildcard le-*.js))
text-format: $(patsubst %.js,../test-report/%.json,$(wildcard tf-*.js))



clean:
	$(Q) rm -rf ../test-report/*

../test-report/%.json: %.js
	$(Q) node ../framework/testing.js -O $@ node $<



.PHONY: all test clean text parser