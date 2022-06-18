/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import React from 'react';

interface GeoCode {
  city: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressId: string;
  calculationMethod: string;
  countryCode: string;
  district: string;
  hasSinglePointCache: string;
  latitude: number;
  longitude: number;
  matchCode: string;
  moduli: number;
  normalizedKey: string;
  position: string;
  postalCode: string;
  source: string;
  tolerance: number;
  tolerance2: number;
  type: string;
  type2: string;
}

export const GeoCodeInfo = ({ props }: any) => (
  <div>
    <div>{props.addressLine1}</div>
    <div>{props.addressLine2}</div>
    <div>{props.city}</div>
    <div>{props.state}</div>
    <div>{props.postalCode}</div>
    <div>{props.countryCode}</div>
    <div>{'NAK: ' + props.normalizedKey}</div>
    <div>{'Tolerance: ' + props.tolerance}</div>
    <div>{'addressii: ' + props.addressId}</div>
    <br />
  </div>
);
