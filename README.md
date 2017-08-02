# simple-nlp

Simple Natural Language Processing utility for analysing phrases of language.
Current pipeline consists of spacy.io NLP library and wordnet Lexical database.

Analyzing a phrase does the following:
1. Analyze the phrase with spacy.io: tokenize and get all sorts of metadata for the tokens
2. Search each token in wordnet and go recursively through the inherited hypernyms
3. Flatten the structure for analysis in a way that groups tokens with hypernyms


## Requirements

Install the requirements for https://github.com/kengz/spacy-nlp

```shell
# install spacy in python3
python3 -m pip install wheel
python3 -m pip install -U socketIO-client
python3 -m pip install -U spacy
python3 -m spacy.en.download
```

## Usage

### Command line interface for trying simple command matching

`npm start`

### Usage as dependency

```
const simpleNLP = require('simple-nlp');

const phrase = 'Trevor play me a song';

simpleNLP.init()
  .then(() => analyzePhrase(answer))
  .then(analysis => {
    console.log(`Analyzed phrase ${phrase}`);
    console.log(JSON.stringify(analysis, null, 2));
  });
```


