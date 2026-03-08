using System;
using System.Collections.Generic;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.UnitTests.Stubs;

public class DescriptionPreprocessorMock : IDescriptionPreprocessor
{
    public Func<string, string>? PreprocessOverride { get; set; } = null;
        
    public string Preprocess(string text)
    {
        return PreprocessOverride != null ? PreprocessOverride(text) : text;
    }

    public Func<string, IReadOnlyCollection<string>>? TokenizeOverride { get; set; } = null;
    public IReadOnlyCollection<string> Tokenize(string preprocessed)
    {
        return TokenizeOverride != null ? TokenizeOverride(preprocessed) : 
                preprocessed.Split(" ");
    }

    public Func<string, IReadOnlyCollection<string>>? GenerateShatteredCombinationsOverride { get; set; } = null;
    public IReadOnlyCollection<string> GenerateShatteredCombinations(string preprocessed)
    {
        return GenerateShatteredCombinationsOverride != null ? GenerateShatteredCombinationsOverride(preprocessed) : 
            [preprocessed.Replace(" ", "")];
    }
}