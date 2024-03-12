import React, { useState } from 'react';
import Greeting from "./Greeting";

function App() {
  const [name, setName] = useState('World');

  return (
    <div>
      <Greeting name={name} />
    </div>
  );
}

export default App;
