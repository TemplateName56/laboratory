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
  const codeRGB = `// C++ code
//
#include <LiquidCrystal_I2C.h>

// button pins
int btn[] = {6, 5, 4, 3, 2};
// RGB pins
int rgb[] = {10, 8, 9};


//initialize lcd
LiquidCrystal_I2C lcd(32,16,2);
  
// connect elements to pins
void setup()
{
  for( int i = 0; i < sizeof( rgb ) / sizeof( rgb[0] ); i++ )
  {
    pinMode( btn[i], INPUT_PULLUP );
    pinMode( rgb[i], OUTPUT );
  }

  set_color( 0, 0, 0 );
  lcd.init();     
  lcd.backlight();
  

  lcd.setCursor(2,0);
  lcd.print("Press a button");
}

void loop()
{
  // RED
  if( digitalRead( btn[0] ) == LOW )
  {
    lcd.clear();
    lcd.setCursor(0,0);
  	lcd.print("Red");
    set_color( 255, 0, 0 );
    Serial.println(btn[0]);
  }
  // GREEN
  else if( digitalRead( btn[1] ) == LOW )
  {
    lcd.clear();
    lcd.setCursor(0,0);
  	lcd.print("Green");
    set_color( 0, 255, 0 );
  }
  // BLUE
  else if( digitalRead( btn[2] ) == LOW )
  {
    lcd.clear();
    lcd.setCursor(0,0);
  	lcd.print("Blue");
    set_color( 0, 0, 255 );
  }
  // Yellow
  else if( digitalRead( btn[3] ) == LOW )
  {
    lcd.clear();
    lcd.setCursor(0,0);
  	lcd.print("Yellow");
    set_color( 255, 255, 0 );
  }
  // Magenta
  else if( digitalRead( btn[4] ) == LOW )
  {
    lcd.clear();
    lcd.setCursor(0,0);
  	lcd.print("Magenta");
    set_color( 255, 0, 255 );
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
    { id: 0, pin: 10, value: false, color: 'red' },
    { id: 1, pin: 8, value: false, color: 'green' },
    { id: 2, pin: 9, value: false, color: 'blue' },
  ]);

  const [btns, setBtns] = useState([
    { id: 6, pin: 6, pressed: false, color: 'red' },
    { id: 5, pin: 5, pressed: false, color: 'green' },
    { id: 4, pin: 4, pressed: false, color: 'blue' },
    { id: 3, pin: 3, pressed: false, color: 'yellow' },
    { id: 2, pin: 2, pressed: false, color: 'magenta' }
  ]);

  const [code, setCode] = useState(codeRGB);
  const [runner, setRunner] = useState<AVRRunner>(new AVRRunner());
  const [status, setStatus] = useState('');
  const [buildResult, setBuildResult] = useState('');
  const [hex, setHex] = useState(null);
  const [sketchName, setSketchName] = useState('sketch');
  const [lcdText, setLcdText] = useState('Press button');

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
    setLcdText(color.charAt(0).toUpperCase() + color.slice(1));
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
      case btns[3].color:
        setLeds([
          { ...leds[0], value: true },
          { ...leds[1], value: true },
          { ...leds[2], value: false }
        ]);
        break;
      case btns[4].color:
        setLeds([
          { ...leds[0], value: true },
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
          <div>
            <wokwi-lcd1602 pins="i2c" text={lcdText}>

            </wokwi-lcd1602>
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