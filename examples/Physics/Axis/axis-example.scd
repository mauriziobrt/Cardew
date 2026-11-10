(// 1. Load a MONO buffer (TGrains requires mono)
b = Buffer.readChannel(s, '/Users/maurizioberta/Music/Samples/Stones/Sounds ok/pietre_bianche.wav', channels: [0]);

(// 2. Grain synth: one grain per t_trig
SynthDef(\grainer, {
	arg out = 0, buf, t_trig = 0, rate = 1, pos = 0, dur = 0.2, pan = 0, amp = 0.5;
	var sig = TGrains.ar(
		numChannels: 2,
		trigger: t_trig,
		bufnum: buf,
		rate: rate,
		centerPos: pos * BufDur.kr(buf),   // pos in 0..1
		dur: dur,
		pan: pan,
		amp: amp,
		interp: 2
	);
	Out.ar(out, sig);
}).add;
);
// 3. Start it (after the buffer and SynthDef are ready)
x = Synth(\grainer, [\buf, b]);

// 4. One grain per OSC message
thisProcess.openUDPPort(57121);
(
OSCdef(\control, { arg msg;
	var vals = msg[2..];   // [0, -131.158, 0, 1, -131.158]
	{ SinOsc.ar(msg[2]+500) * EnvGen.ar(Env.perc(0.01, 0.2), doneAction: 2) * 0.2 ! 2 }.play;
	//vals.postln;
   /* x.set(
        \t_trig, 1,
        \rate, 1,           // map from vals as needed
        \pos, 0,
        \dur, 4
    );*/
}, '/control', recvPort: 57121);))