const currencyNumberFormat = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
});

interface CurrProps {
    input: number | string,
    colored?: boolean,
    isPositive?: boolean
}

export function Curr({input, colored, isPositive}: CurrProps){
    let inputAsNumber: number = 0;
    if (typeof input === "number") {
        inputAsNumber = input;
    } else if (typeof input === "string") {
        inputAsNumber = Number(input.replace(",", "."));
    }
    
    const colorDecision = (isPositive == undefined && inputAsNumber >= 0) || isPositive;
    
    return (
        <span className={`font-mono ${colored && (colorDecision ? "text-green-600" : "text-red-600")}`}>{currencyNumberFormat.format(inputAsNumber)}</span>
    );
}