#Verbosity options
Q:=@
MAKE_FLAGS:=--no-print-directory
REPORT:=../test-report

run_all_tests:
	$(Q) $(MAKE) $(MAKE_FLAGS) clean
	$(Q) $(MAKE) $(MAKE_FLAGS) -j report


report: all	#TODO - should be "all" but now we are testing specific things
	$(Q) ls $(REPORT)/*.json | node ../framework/collate-reports.js

#Excluding "test" from "all" for the moment since we haven't added support for expecting failures and we have expected failures in test
all: parser #switchable-iterator xml-processing templates parser text

test: $(patsubst %.js,$(REPORT)/%.json,$(wildcard test-*.js))

switchable-iterator: $(patsubst %.js,$(REPORT)/%.json,$(wildcard swit-*.js))
xml-processing: $(patsubst %.js,$(REPORT)/%.json,$(wildcard xml-processing-*.js))
templates: $(patsubst %.js,$(REPORT)/%.json,$(wildcard template-*.js))

parser: parser-language parser-state
text: indent line-endings text-format line-processing text-tree-processing

line-processing: $(patsubst %.js,$(REPORT)/%.json,$(wildcard lp-*.js))
text-tree-processing: $(patsubst %.js,$(REPORT)/%.json,$(wildcard tt-processing-*.js))

parser-language: $(patsubst %.js,$(REPORT)/%.json,$(wildcard pl-*.js))
parser-state: $(patsubst %.js,$(REPORT)/%.json,$(wildcard ps-*.js))

indent: $(patsubst %.js,$(REPORT)/%.json,$(wildcard indent-*.js))
line-endings: $(patsubst %.js,$(REPORT)/%.json,$(wildcard le-*.js))
text-format: $(patsubst %.js,$(REPORT)/%.json,$(wildcard tf-*.js))



clean:
	$(Q) rm -rf $(REPORT)/*

$(REPORT)/%.json: %.js
	$(Q) node ../framework/testing.js -O $@ node $<



.PHONY: all test clean text parser