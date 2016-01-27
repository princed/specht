Check UI Links
==============

```
$ npm install check-ui-links --save 
$ check-ui-links --help

Usage: check-ui-links [path] [options]

Example: /usr/local/bin/check-help-links client-side \
--pattern https://www.jetbrains.com/hub/help/1.0/%s.html \
--ignore-file .gitignore \
--html-rules svg:xlink:href hub-page-help-link:url \
--js-rules getHelpUrlFilter getSome:1 \
--html-extension .html .htm \
--teamcity

Options:
  --pattern         Help site pattern, like:
                    https://www.jetbrains.com/hub/help/1.0/%s.html    [required]
  --ignore-file     Files and directories to ignore, uses .gitgnore format.
                    Relative from path.
  --html-rules      Rules of parsing JavaScript files, in form of <function
                    name>[:<argument number, default is 0>].  [array] [required]
  --js-rules        Rules of parsing HTML files, in form of <tag
                    name>:<attribute name>. XML namespaces for attributes are
                    supported.                                [array] [required]
  --html-extension  Extensions of HTML files        [array] [default: [".html"]]
  --js-extension    Extensions of JavaScript files    [array] [default: [".js"]]
  --teamcity        Report check results to TeamCity                   [boolean]
  --help            Show help                                          [boolean]
```
