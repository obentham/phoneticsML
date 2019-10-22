# phoneticsML

link to website: https://obentham.github.io/phoneticsML/

This website lets you upload your own vowel formant data and perform k-means clustering on your own computer. 

If you don't have your own data, there are some examples available in [example_data/](example_data/).

If you're providing your own data, the format of the input should be a .csv file with 4 columns: Word, Vowel, F1 and F2. If you run into trouble, check to make sure you don't have any empty lines at the end of your .csv file. The table below is an example of valid input taken from [example_data/simple_formants.csv](example_data/simple_formants.csv):

 Word   | Vowel | F1  | F2   |
--------|-------|-----|------|
 beat   | i     | 264 | 2352 |
 bit    | ɪ     | 418 | 1918 |
 bait   | e     | 407 | 2008 |
 bet    | ɛ     | 564 | 1749 |
 bat    | æ     | 633 | 1716 |
 but    | ʌ     | 584 | 1188 |
 Bert   | ə     | 414 | 1208 |
 boot   | u     | 356 | 1302 |
 book   | ʊ     | 483 | 1049 |
 boat   | o     | 491 | 1093 |
 bought | ɔ     | 702 | 746  |
 pot    | ɑ     | 652 | 1029 |
