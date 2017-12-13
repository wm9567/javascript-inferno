Contributing to Inferno
==========================

Many thanks for using Inferno and contributing to its development. The following is a quick set of guidelines designed to maximise your contribution's effectiveness.

Got a question or need help?
----------------------------

If you're having trouble getting Inferno to do what you want, there are a couple of places to get help before submitting an issue:

* [Stack Overflow questions tagged infernojs](http://stackoverflow.com/questions/tagged/infernojs)

Of course, if you've encountered a bug, then the best course of action is to raise an issue (if no-one else has!).

Reporting security vulnerabilities
----------------------------------

If you think you've found a security vulnerability, please email [Dominic Gannaway](mailto:dg@domgan.com) with details, and he will respond to you if he isn't at work by that time.

Repository Layout
-----------------

The repository structures as a monorepo utilizing [lerna](https://github.com/lerna/lerna) as a management tool of choice. Lerna setup and linking are part of the `postinstall` task so it should be automatically
run after `npm install`. `lerna` executes command based on a topological-sorted order of packages based on their dependencies.

For example, if you want to see the order of packages being processed, you can do:
```
$ lerna exec -- node -e "console.log(require('./package.json').name)"
Lerna v2.0.0-beta.36
inferno-shared
inferno-vnode-flags
inferno
inferno-hyperscript
inferno-create-element
inferno-devtools
inferno-router
inferno-create-class
inferno-compat
inferno-server
inferno-redux
inferno-mobx
inferno-test-utils
```

Source files are written in TypeScript and tests are written in JS/JSX consuming the dist files.

Running tests
-------------
Always include tests for the functionality you want to add into Inferno. This way we can avoid regression in future.

Make sure you have lerna tool installed globally.

```
npm i -g lerna
```

- Clone the repository, and clean it. `lerna clean`
- Install development dependencies `npm i`
- build typescript files `npm run build`
- run tests `npm run test`


Pull requests
-------------


**Pull requests against the master branch will not be merged!**

All pull requests are welcome. You should create a new branch, based on the [dev branch](https://github.com/infernojs/inferno/tree/dev), and submit the PR against the dev branch.

*Caveat for what follows: If in doubt, submit the request - a PR that needs tweaking is infinitely more valuable than a request that wasn't made because you were worrying about meeting these requirements.*

Before submitting, run `npm run build` (which will concatenate, lint and test the code) to ensure the build passes - but don't include files from outside the `src` and `test` folders in the PR.

And make sure the PR haven't been published before!

There isn't (yet) a formal style guide for Inferno, so please take care to adhere to existing conventions:

* Tabs, not spaces!
* Semi-colons
* Single-quotes for strings

Above all, code should be clean and readable, and commented where necessary. If you add a new feature, make sure you add a test to go along with it!


Small print
-----------

There's no contributor license agreement - contributions are made on a common sense basis. Inferno is distributed under the MIT license, which means your contributions will be too.

Debugging
---------
Its possible to debug inferno tests by running following command `npm run debug` and open chrome web address: chrome://inspect/#devices
However: The issue is that ts-jest does post processing to compiled files this needs to be avoided to see sources are they are.
Edit following files: /node_modules/ts-jest/dist/postprocess.js and remove following settings line numer 15 => retainLines: true, sourceMaps: 'inline'.

Pro tip: You can filter down number of tests by editing `debug` -task:
`node --inspect-brk ./node_modules/.bin/jest {*edit this*} --runInBand --no-cache --no-watchman`
Change parameter to jest to match only files you want to run.
Happy debugging!
