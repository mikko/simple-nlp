module.exports = {
    maxPointerDepth: 2,
    pointerTypes: {
        HYPERNYM: '@',
        CATEGORY: ';c',
        USAGE: ';u',
        DERIVATIONALLY_RELATED: '+'
    },
    posMap: { // for mapping spacy to wordnet
        VERB: 'v',
        NOUN: 'n',
        DET: '',
        PRON: '',
        ADJ: 'a'
    },
    tokenTypes: {
        NOUN: '',
        VERB: '',
        ADJECTIVE: '',
        ADVERB: '',
    },
    wordnetKeys: [
        'lemma',
        'synonyms',
        'def',
        'pos'
    ],
    entityTypes: {
        PERSON: 'persons', // People, including fictional.
        NORP: 'nationalities', // Nationalities or religious or political groups.
        FACILITY: 'facilities', // Buildings, airports, highways, bridges, etc.
        ORG: 'organisations', // Companies, agencies, institutions, etc.
        GPE: 'locations', // Countries, cities, states.
        LOC: 'locations', // Non-GPE locations, mountain ranges, bodies of water.
        PRODUCT: 'products', // Objects, vehicles, foods, etc. (Not services.)
        EVENT: 'events', // Named hurricanes, battles, wars, sports events, etc.
        WORK_OF_ART: 'art', // Titles of books, songs, etc.
        LANGUAGE: 'languages', // Any named language.
        DATE: 'dates', // Absolute or relative dates or periods.
        TIME: 'times', // Times smaller than a day.
        PERCENT: 'percentages', // Percentage, including "%".
        MONEY: 'money', // Monetary values, including unit.
        QUANTITY: 'quantities', // Measurements, as of weight or distance.
        ORDINAL: 'ordinal', // "first", "second", etc.
        CARDINAL: 'cardinal' // Numerals that do not fall under another type.
    }
};
