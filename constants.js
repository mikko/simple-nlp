module.exports = {
    pointerTypes: {
        HYPERNYM: '@',
        CATEGORY: ';c',
        USAGE: ';u',        
    },
    posMap: { // for mapping spacy to wordnet
        VERB: 'v',
        NOUN: 'n',
        DET: '',
        PRON: '',
        ADJ: 's'
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
        'def'
    ]
}