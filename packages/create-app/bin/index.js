#!/usr/bin/env node

const path = require('path');
const bootstrapPath = path.resolve(__dirname, '..', 'dist/index.js');
require(bootstrapPath);

