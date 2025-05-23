'use client';

import styles from "../page.module.css";
import AceEditor from "react-ace";
import { useState, useEffect } from 'react';
import { AVRRunner } from '../services/execute';
import classNames from 'classnames';
import "@wokwi/elements";

import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

export default function () {
  const codeRGB = `// button pins
int btn[] = {4, 3, 2};
// RGB pins
int rgb[] = {11, 10, 9};
  
// connect elements to pins
void setup()
{
  for( int i = 0; i < sizeof( rgb ) / sizeof( rgb[0] ); i++ )
  {
    pinMode( btn[i], INPUT_PULLUP );
    pinMode( rgb[i], OUTPUT );
  }

  set_color( 0, 0, 0 );
}

void loop()
{
  // RED
  if( digitalRead( btn[0] ) == LOW )
  {
    set_color( 255, 0, 0 );
  }
  // GREEN
  else if( digitalRead( btn[1] ) == LOW )
  {
    set_color( 0, 255, 0 );
  }
  // BLUE
  else if( digitalRead( btn[2] ) == LOW )
  {
    set_color( 0, 0, 255 );
  }
}
  
// function to change rgb color
void set_color( int red, int green, int blue )
{
  analogWrite( rgb[0], red );
  analogWrite( rgb[1], green );
  analogWrite( rgb[2], blue );
}`

  const [leds, setLeds] = useState([
    { id: 0, pin: 11, value: false, color: 'red' },
    { id: 1, pin: 10, value: false, color: 'green' },
    { id: 2, pin: 9, value: false, color: 'blue' },
  ]);

  const [btns, setBtns] = useState([
    { id: 3, pin: 2, pressed: false, color: 'red' },
    { id: 4, pin: 3, pressed: false, color: 'green' },
    { id: 5, pin: 4, pressed: false, color: 'blue' }
  ]);

  const [code, setCode] = useState(codeRGB);
  const [runner, setRunner] = useState<AVRRunner>(new AVRRunner());
  const [status, setStatus] = useState('');
  const [buildResult, setBuildResult] = useState('');
  const [hex, setHex] = useState(null);
  const [sketchName, setSketchName] = useState('sketch');

  runner.portB.addListener((value) => {
    console.log('PortB');
    updateRGB(value, 8);
  });

  const handleBuildAndUpload = async () => {
    setHex(null);
    try {
      const response = await fetch('http://localhost:8080/api/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          sketch: sketchName
        }),
      });
      if (response.ok) {
        const result = await response.json();
        setBuildResult(result.output);
        setHex(result.hex);
        setStatus(result.code == 0 ? 'Success' : 'Error');
      } else {
        console.error('Failed to build and upload:', response.statusText);
        setBuildResult('Failed to build and upload');
        setStatus('Error');
      }
    } catch (error) {
      console.error('Error during API call:', error);
      setBuildResult('Error during API call');
    }
  };

  const pressBtn = (color: string) => {
    switch (color) {
      case btns[0].color:
        setLeds([
          { ...leds[0], value: true },
          { ...leds[1], value: false },
          { ...leds[2], value: false }
        ]);
        break;
      case btns[1].color:
        setLeds([
          { ...leds[0], value: false },
          { ...leds[1], value: true },
          { ...leds[2], value: false }
        ]);
          break;
        case btns[2].color:
          setLeds([
            { ...leds[0], value: false },
            { ...leds[1], value: false },
            { ...leds[2], value: true }
          ]);
          break;
        default:
          break;
    }
  }

  const updateRGB = (value: number, startPin: number) => {
    for (const led of leds) {
      const pin = led.pin;
      if (pin >= startPin && pin <= startPin + 8) {
        setLeds((prevLeds) =>
          prevLeds.map((led) =>
            led.pin === pin ? { ...led, value: value & (1 << (pin - startPin)) ? true : false } : led
          )
        );
      }
    }
  };

  const onChange = (newValue: string) => {
    setCode(newValue);
  };

  useEffect(() => {
    setLeds(leds.map((led) => ({ ...led, value: false })));

    runner.stop();
    if (hex) {
      runner.uploadHex(hex || '');

      runner.execute(() =>{})
    }
  
  }, [hex]);
  
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.column}>
          <AceEditor
            value={code}
            mode="c_cpp"
            theme="monokai"
            name="UNIQUE_ID_OF_DIV"
            onChange={onChange}
            editorProps={{ $blockScrolling: true }}
          />
          <button onClick={handleBuildAndUpload}>Build and Upload</button>
        </div>

        <div className={styles.column}>

          <div>
            <wokwi-rgb-led
              pinRed={leds[0].pin}
              pinGreen={leds[1].pin}
              pinBlue={leds[2].pin} 
              ledRed={leds[0].value ? 1 : 0}
              ledGreen={leds[1].value ? 1 : 0}
              ledBlue={leds[2].value ? 1 : 0} >
            </wokwi-rgb-led>
          </div>

          <div>
            {btns.map((btn) => (
              <wokwi-pushbutton
                key={btn.id}
                pin={btn.pin}
                color={btn.color}
                onClick={() => pressBtn(btn.color)}
                label={`Make it ${btn.color.toUpperCase()}`} >
              </wokwi-pushbutton>
            ))}
          </div>

        </div>
      </div>

      <div>
        <h2>OUTPUT</h2>
        <h3>Status: {status} </h3>
        <div id="output">
          {buildResult}
        </div>
      </div>
    </main >
  );
}