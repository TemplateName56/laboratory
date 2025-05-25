'use client';

import styles from "../page.module.css";
import AceEditor from "react-ace";
import { useState, useEffect } from 'react';
import { AVRRunner } from '../services/execute';
import classNames from 'classnames';
import "@wokwi/elements";
import Link from 'next/link'

import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

export default function () {
  const codeRGB = `// C++ code
//
#include <LiquidCrystal_I2C.h>

// RGB pins
int rgb[] = {10, 8, 9};

int smokeA0 = A0;

const int MIN_SENSOR_VALUE = 85;
const int MAX_SENSOR_VALUE = 385;

// Ініціалізація екрану
LiquidCrystal_I2C lcd(32,16,2);
  
// Підключення пінів
void setup()
{
  pinMode(smokeA0, INPUT);
  for(int i = 0; i < 3; i++ )
  {
    pinMode(rgb[i], OUTPUT );
  }

  set_color(0, 0, 0);
  
  lcd.init();     
  lcd.backlight();
  
  lcd.setCursor(0,0);
  lcd.print("Gas level:");
}

void loop()
{
  int analogSensor = analogRead(smokeA0);
  // Перетворюємо ренж з 85-385 у 0-100
  int gas = map(analogSensor, MIN_SENSOR_VALUE, MAX_SENSOR_VALUE, 0, 100);
  if (gas < 26)
  {
    lcd.setCursor(1,1);
    lcd.print(gas);
    set_color(0, 255, 0);
  }
  else if (gas >= 26 && gas < 76)
  {
    lcd.setCursor(1,1);
    lcd.print(gas);
    set_color(255, 255, 0);
  }
  else 
  {
    lcd.setCursor(1,1);
    lcd.print(gas);
    set_color(255, 0, 0);
  }
}
  
// function to change rgb color
void set_color(int red, int green, int blue)
{
  analogWrite(rgb[0], red);
  analogWrite(rgb[1], green);
  analogWrite(rgb[2], blue);
}`

  const [leds, setLeds] = useState([
    { id: 0, pin: 10, value: false, color: 'red' },
    { id: 1, pin: 8, value: false, color: 'green' },
    { id: 2, pin: 9, value: false, color: 'blue' },
  ]);

  const [code, setCode] = useState(codeRGB);
  const [runner, setRunner] = useState<AVRRunner>(new AVRRunner());
  const [status, setStatus] = useState('');
  const [buildResult, setBuildResult] = useState('');
  const [hex, setHex] = useState(null);
  const [sketchName, setSketchName] = useState('sketch');
  const [lcdText, setLcdText] = useState('Gas level: 0');
  const [gasLevel, setGasLevel] = useState(0.0)

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

  const handleGasChange = (e) => {
    const val = parseFloat(e.target.value);
    setGasLevel(val);
    var gasSensorValue = Math.round(gasLevel * 100)
    if (gasSensorValue < 26) {
      setLcdText("Gas level:\n" + gasSensorValue);
      setLeds([
          { ...leds[0], value: false },
          { ...leds[1], value: true },
          { ...leds[2], value: false }
        ]);
    } else if (gasSensorValue >= 26 && gasSensorValue < 76) {
      setLcdText("Gas level:\n" + gasSensorValue);
      setLeds([
          { ...leds[0], value: true },
          { ...leds[1], value: true },
          { ...leds[2], value: false }
        ]);
    } else {
      setLcdText("Gas level:\n" + gasSensorValue);
      setLeds([
          { ...leds[0], value: true },
          { ...leds[1], value: false },
          { ...leds[2], value: false }
        ]);
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
          <Link href="/">Home</Link>
          <div>
            <label >Code:</label>
          </div>
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
            <wokwi-gas-sensor>

            </wokwi-gas-sensor>
          </div>
          <div>
            <input
              id="gasRange"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={gasLevel}
              onChange={handleGasChange}
              style={{ width: '100%', marginTop: '5px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
              <span>Safe (0-25%)</span>
              <span>Warning (26-75%)</span>
              <span>Danger (76-100%)</span>
            </div>
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