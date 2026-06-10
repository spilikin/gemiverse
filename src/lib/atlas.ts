export default {
	federations: {
		test: {
			url: 'https://app-test.federationmaster.de'
		},
		ref: {
			url: 'https://app-ref.federationmaster.de'
		},
		prod: {
			url: 'https://app.federationmaster.de'
		}
	},
	tsl: {
		test: {
			url: 'https://download-test.tsl.ti-dienste.de/ECC/ECC-RSA_TSL-test.xml',
			qesUrl: null
		},
		ref: {
			url: 'https://download-ref.tsl.ti-dienste.de/ECC/ECC-RSA_TSL-ref.xml',
			qesUrl: null
		},
		prod: {
			url: 'https://download.tsl.ti-dienste.de/ECC/ECC-RSA_TSL.xml',
			qesUrl: 'https://tl.bundesnetzagentur.de/TL-DE.XML'
		}
	},
	catalog: {
		dev: {
			url: 'https://service-discovery.dev.ti-platform.de/catalog.json'
		},
		ref: {
			url: 'https://service-discovery.ref.ti-platform.de/catalog.json'
		},
		test: {
			url: 'https://service-discovery.test.ti-platform.de/catalog.json'
		},
		prod: {
			url: 'https://service-discovery.prod.ti-platform.de/catalog.json'
		}
	}
};
