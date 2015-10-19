function config() {
	return {
		env: 'local', // local or dev
		local: {
			APIServer: 'http://localhost:3004',
			HTTPServer: 'http://localhost:3003'
		},
		dev: {
			APIServer: 'http://188.166.47.232:3004',
			HTTPServer: 'http://188.166.47.232:3003'
		},
		serverDB: {
			APIServer: 'http://188.166.47.232:3004',
			HTTPServer: 'http://localhost:3003'
		}
	}
}

config.prototype.getConfig = function() {
	return {
		env: 'local', // local or dev
		local: {
			APIServer: 'http://localhost:3004',
			HTTPServer: 'http://127.0.0.1:3003'
		},
		dev: {
			APIServer: 'http://188.166.47.232:3004',
			HTTPServer: 'http://188.166.47.232:3003'
		}
	}
};

module.exports = config;