/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { fontFamily, fontSize, gray1, gray2, gray5 } from './Styles';
import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

type FormData = {
  search: string;
};

export const Header = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();
  const [searchParams] = useSearchParams();
  const criteria = searchParams.get('criteria') || '';

  const submitForm = ({ search }: FormData) => {
    navigate(`search?criteria=${search}`);
  };

  return (
    <div
      css={css`
        position: static;
        box-sizing: border-box;
        top: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 20px;
        background-color: #fff;
      `}
    >
      <Link
        to="/"
        css={css`
          font-size: 16px;
          font-weight: bold;
          color: #121212;
          text-decoration: none;
        `}
      >
        Bulk GeoCode Data Editor
      </Link>
      <form onSubmit={handleSubmit(submitForm)}>
        <input
          ref={register}
          name="search"
          type="text"
          placeholder="Search..."
          defaultValue={criteria}
          css={css`
            box-sizing: border-box;
            font-family: ${fontFamily};
            font-size: ${fontSize};
            padding: 8px 10px;
            border: 1px solid ${gray5};
            border-radius: 3px;
            color: ${gray2};
            background-color: white;
            width: 200px;
            height: 30px;
            :focus {
              outline-color: ${gray5};
            }
          `}
        />
      </form>
    </div>
  );
};
