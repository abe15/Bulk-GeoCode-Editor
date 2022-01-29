/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import React from 'react';
import { Upload } from './JSONInput';
const drawerWidth = 240;

export default function SideMenu(props: any) {
  return (
    <div
      css={css`
        z-index: 99;
        float: left;
        top: 100px;
        position: absolute;
        background-color: whitesmoke;
        height: 85vh;
        width: 250px;
        overflow-y: scroll;
      `}
    >
      {props.children}
    </div>
  );
}
