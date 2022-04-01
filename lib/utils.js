import * as anchor from '@project-serum/anchor'
import numberToBN from 'number-to-bn'

export const BN = (_, amount) => new anchor.BN(amount)

export const fromBase = (self, input, baseDecimals=9, optionsInput) => {
  const base = self.BN('10').pow(self.BN(baseDecimals.toString()))
  let baseValue = numberToBN(input);
  const negative = baseValue.lt(self.BN('0'));
  const baseLength = base.toString().length - 1 || 1;
  const options = optionsInput || {};

  if(negative) {
    baseValue = baseValue.mul(self.BN('-1'));
  }

  let fraction = baseValue.mod(base).toString(10);

  while(fraction.length < baseLength) {
    fraction = `0${fraction}`;
  }

  if(!options.pad) {
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
  }

  let whole = baseValue.div(base).toString(10);

  if(options.commify) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  let value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`;

  if(negative) {
    value = `-${value}`;
  }

  return value;
}

export const toBase = (self, value, baseDecimals=9) => {
  const base = self.BN('10').pow(self.BN(baseDecimals.toString()))
  const negative = (value.substring(0, 1) === '-');
  if(negative) {
    value = value.substring(1);
  }

  const comps = value.split('.')
  if(comps.length > 2) {
    throw new Error(`[web3/utils] while converting number ${value} to base,  too many decimal points`)
  }

  let whole = comps[0]
  let fraction = comps[1]

  if(!whole) {
    whole = '0'
  }
  if(!fraction) {
    fraction = '0'
  }
  else {
    fraction = fraction.slice(0, Number(baseDecimals))
  }
  if(fraction.length > Number(baseDecimals)) {
    throw new Error(`[web3/utils] while converting number ${value} to base, too many decimal places`)
  }

  while(fraction.length < Number(baseDecimals)) {
    fraction += '0'
  }

  whole = self.BN(whole)
  fraction = self.BN(fraction)
  let wei = (whole.mul(self.BN(base.toString()))).add(fraction)

  if(negative) {
    wei = wei.mul(self.BN('-1'))
  }

  return self.BN(wei.toString(10), 10).toString()
}
