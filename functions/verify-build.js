try {
    console.log('Loading module...');
    require('./lib/index.js');
    console.log('Module loaded successfully!');
} catch (error) {
    console.error('Error loading module:', error);
    process.exit(1);
}
