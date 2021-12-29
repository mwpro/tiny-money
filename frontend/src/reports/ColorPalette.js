export default {
  colors: [
    'rgb(78,121,167, 0.8)',
    'rgb(160,203,232, 0.8)',
    'rgb(242,142,43, 0.8)',
    'rgb(255,190,125, 0.8)',
    'rgb(89,161,79, 0.8)',
    'rgb(140,209,125, 0.8)',
    'rgb(182,153,45, 0.8)',
    'rgb(241,206,99, 0.8)',
    'rgb(73,152,148, 0.8)',
    'rgb(134,188,182, 0.8)',
    'rgb(225,87,89, 0.8)',
    'rgb(255,157,154, 0.8)',
    'rgb(121,112,110, 0.8)',
    'rgb(186,176,172, 0.8)',
    'rgb(211,114,149, 0.8)',
    'rgb(250,191,210, 0.8)',
    'rgb(176,122,161, 0.8)',
    'rgb(212,166,200, 0.8)',
    'rgb(157,118,96, 0.8)',
    'rgb(215,181,166, 0.8)',
  ],
  negative: 'rgb(225,87,89, 0.8)',
  positive: 'rgb(89,161,79, 0.8)',
  getColor(itemId) {
    if (itemId > this.colors.length) {
      console.warn(`Color for item ${itemId} will be reused`)
    }
    return this.colors[itemId % this.colors.length];
  }
}
