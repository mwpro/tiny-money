const currencyNumberFormat = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
});

interface CurrProps {
    input: number | string,
    colored?: boolean,
    isPositive?: boolean
}

export function inputAsNumber(input: number | string): number {
    if (typeof input === "number") {
        return input;
    } else if (typeof input === "string") {
        return Number(input.replace(",", "."));
    }
    return 0;
}

export function formatCurrencyAsString(input: number) {
    return currencyNumberFormat.format(inputAsNumber(input));
}

export function Curr({input, colored, isPositive}: CurrProps){
    const num = inputAsNumber(input);
    
    const colorDecision = (isPositive == undefined && num >= 0) || isPositive;
    
    return (
        <span className={`font-mono tabular-nums ${colored && (colorDecision ? "text-income" : "text-expense")}`}>{currencyNumberFormat.format(num)}</span>
    );
}