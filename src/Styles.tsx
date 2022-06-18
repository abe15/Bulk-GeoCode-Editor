import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { LayerProps } from 'react-map-gl';

export const gray1 = '#383737';
export const gray2 = '#5c5a5a';
export const gray3 = '#857c81';
export const gray4 = '#b9b9b9';
export const gray5 = '#e3e2e2';
export const gray6 = '#f7f8fa';

export const primary1 = '#681c41';
export const primary2 = '#824c67';

export const accent1 = '#dbb365';
export const accent2 = '#efd197';

export const fontFamily = "'Segoe UI', 'Helvetica Neue',sans-serif";
export const fontSize = '16px';

export const PrimaryButton = styled.button`
  background-color: ${primary2};
  border-color: ${primary2};
  border-style: solid;
  border-radius: 5px;
  font-family: ${fontFamily};
  font-size: ${fontSize};
  padding: 5px 10px;
  color: white;
  cursor: pointer;
  :hover {
    background-color: ${primary1};
  }
  :focus {
    outline-color: ${primary2};
  }
  :disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Fieldset = styled.fieldset`
  margin: 10px auto 0 auto;
  padding: 30px;
  width: 350px;
  background-color: ${gray6};
  border-radius: 4px;
  border: 1px solid ${gray5};
  box-shadow: 0 3px 5px 0 rgba(0, 0, 0, 0.16);
`;

export const FieldContainer = styled.div`
  margin-bottom: 10px;
`;

export const FieldLabel = styled.label`
  font-weight: bold;
`;

export const boxdraw = css`
  background: rgba(56, 135, 190, 0.1);
  border: 2px solid #3887be;
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
`;

const baseFieldCSS = css`
  box-sizing: border-box;
  font-family: ${fontFamily};
  font-size: ${fontSize};
  margin-bottom: 5px;
  padding: 8px 10px;
  border: 1px solid ${gray5};
  border-radius: 3px;
  color: ${gray2};
  background-color: white;
  width: 100%;
  :focus {
    outline-color: ${gray5};
  }
  :disabled {
    background-color: ${gray6};
  }
`;

export const FieldInput = styled.input`
  ${baseFieldCSS}
`;

export const FieldTextArea = styled.textarea`
  ${baseFieldCSS}
  height: 100px;
`;

export const FieldError = styled.div`
  font-size: 12px;
  color: red;
`;

export const FormButtonContainer = styled.div`
  margin: 30px 0px 0px 0px;
  padding: 20px 0px 0px 0px;
  border-top: 1px solid ${gray5};
`;

export const SubmissionSuccess = styled.div`
  margin-top: 10px;
  color: green;
`;
export const SubmissionFailure = styled.div`
  margin-top: 10px;
  color: red;
`;

export const LayerStyleText: LayerProps = {
  id: 'point-labels',
  type: 'symbol',
  // source: 'points-data',
  paint: {},
  layout: {
    visibility: 'visible',

    'icon-size': 1,
    'text-field': '{moduli}',
    'text-size': [
      'match',
      ['get', 'type'],
      'roadEntry',
      15,
      'deliveryPoint',
      15,
      10,
    ],
    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
    'text-offset': [0, -0.5],
    'text-anchor': 'top',
  },

  filter: ['in', 'type2', 'roadEntry', 'deliveryPoint'],
};

export const LayerStyleGeoFence: LayerProps = {
  id: 'polygon',
  type: 'fill',
  //  source: 'polygon',
  layout: {},
  paint: {
    'fill-color': 'rgb(51,204,254)',
    'fill-opacity': 0.1,
  },
  filter: ['in', 'position'],
};

export const LayerStyleActivePoints: LayerProps = {
  id: 'point-highlighted',
  type: 'circle',
  // source: 'points-data',
  paint: {
    'circle-radius': [
      'match',
      ['get', 'type'],
      'roadEntry',
      30,
      'deliveryPoint',
      30,
      8,
    ],
    'circle-color': [
      'match',
      ['get', 'type'],
      'roadEntry',
      'rgba(255,0,0,.5)',
      'deliveryPoint',
      'rgba(51,204,254,.5)',
      'yellow',
    ],
  },
  filter: ['in', 'position'],
};

export const LayerStyleBasePoints: LayerProps = {
  type: 'circle',
  source: 'points-data',
  id: 'basepoints',
  paint: {
    'circle-radius': [
      'match',
      ['get', 'type'],
      'roadEntry',
      8,
      'deliveryPoint',
      8,
      8,
    ],
    'circle-color': [
      'match',
      ['get', 'type'],
      'roadEntry',
      '#f70027',
      'deliveryPoint',
      '#26f7fd',
      'yellow',
    ],
  },

  filter: ['in', 'type', 'roadEntry', 'deliveryPoint'],
};
