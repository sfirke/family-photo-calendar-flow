#!/bin/bash
# Script to run tests with increased Node.js memory allocation
export NODE_OPTIONS="--max-old-space-size=8192 --expose-gc"
vitest "$@"