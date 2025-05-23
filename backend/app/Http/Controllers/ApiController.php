<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApiController extends Controller
{
    public function build(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required'
        ]);
        $code = $validated['code'];

        // Specify the path to the file
        $filePath = storage_path('app/sketch/sketch.ino');
        $scriptPath = base_path('build.sh');
        Storage::put('sketch/sketch.ino', $code);
        //TODO MOVE IT TO DOCKEFILE
        exec('arduino-cli lib install "LiquidCrystal I2C"');
        exec("/usr/local/bin/arduino-cli core install arduino:avr");
        exec("bash $scriptPath 2>&1", $output, $returnCode);

        // Save the content to the file
        return response()->json([
            'output' => $output,
            'code' => $returnCode,
            'hex' => $returnCode == 0 ? Storage::get('sketch/build/sketch.ino.hex') : null
        ]);
    }
}
