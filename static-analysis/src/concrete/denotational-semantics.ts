import { Stm, T } from '../syntax';
import { substState, evalAexpr, evalBexpr } from './eval';
import { compose } from 'fp-ts/lib/function';
import { State } from './state';

/**
 * The set of partial functions State -> State is a chain complete partially ordered set.
 * A functional takes a state (function), and performs an operation with it that
 * results in another state.
 */
type FunctionalStm = (state: State) => State;

const cond = (p: (s: State) => T) => (g1: FunctionalStm) => (g2: FunctionalStm) => (
  state: State,
) => {
  return p(state) ? g1(state) : g2(state);
};

export const semantic = (stm: Stm) => (state: State): State => {
  switch (stm.type) {
    case 'Ass': {
      const { name, aexpr } = stm;
      return substState(state)(name)(evalAexpr(aexpr)(state));
    }
    case 'Skip':
      return state;
    case 'Comp': {
      const { stm1, stm2 } = stm;
      return compose(
        semantic(stm2),
        semantic(stm1),
      )(state);
    }
    case 'If': {
      const { bexpr, stm1, stm2 } = stm;
      return cond(evalBexpr(bexpr))(semantic(stm1))(semantic(stm2))(state);
    }
    case 'While': {
      const { bexpr, stm: whileStm } = stm;

      let s = state;

      while (evalBexpr(bexpr)(s)) s = semantic(whileStm)(s);

      return s;
    }
  }
};
