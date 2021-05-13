var dts = require('dts-bundle');

dts.bundle({
	name: 'civet',
    main: 'src/public/civet.ts',
    removeSource: true
});

console.info('bundle finish')
