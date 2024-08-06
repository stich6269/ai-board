export function priceFormatter(num: number = 0, round: number = 0) {
    return '₪' + (Math.abs(+num)).toFixed(round).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
