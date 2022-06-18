/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { Paper } from '@material-ui/core';

import React from 'react';

const drawerWidth = 240;

export default function SideMenu(props: any) {
  return (
    <Paper
      elevation={5}
      css={css`
        z-index: 99;
        float: left;
        top: 50px;
        position: relative;
        background-color: #fff;
        height: 85vh;
        padding: 0px 10px 0px 5px;
        width: 310px;
        overflow-y: 'scroll';
        overflow-x: 'hidden';
        display: flex;
        flex-direction: column;
      `}
    >
      {props.children}
    </Paper>
  );
}
