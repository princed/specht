/* eslint no-param-reassign:0 import/no-extraneous-dependencies:0 */

let fs;
try {
  fs = require('graceful-fs');
} catch (error) {
  fs = require('readdirp/node_modules/graceful-fs');
}

export default function enableHackForMockFs(mockFs) {
  const restoreList = [];

  Object.keys(mockFs).forEach((key) => {
    const propertyDescription = Object.getOwnPropertyDescriptor(fs, key);

    if (propertyDescription.writable) {
      const realMethod = fs[key];
      const mockMethod = mockFs[key];

      restoreList.push(() => {
        fs[key] = realMethod;
      });

      fs[key] = mockMethod;
    }
  });

  return function restoreFn() {
    restoreList.forEach((cb) => cb());
  };
}

