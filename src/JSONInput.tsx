import React, { useState } from 'react';
let a = {};
export function Upload() {
  const [files, setFiles] = useState({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files![0], 'UTF-8');
    fileReader.onload = (e) => {
      localStorage.setItem('geocodes', JSON.stringify(e.target!.result));
    };
  };
  return (
    <>
      <h1>Upload Json file - Example</h1>

      <input type="file" onChange={handleChange} />
      <br />
      {'uploaded file content -- ' + files}
    </>
  );
}
