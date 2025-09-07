# Narrative Draft: The Theseus Protocol (Revision 1)

This document outlines the full story for the generative adventure game. The narrative includes a main path leading to a tragic victory, as well as several "Bandersnatch"-style failure loops. The text has been revised for quality and tonal consistency.

**Note on Transitions:** Passages marked with `[Auto-Transition]` should be implemented as intermediary nodes with `auto_transition: true` in the final `story.json`.

---

## Part 1: The Arrival

### Node: `start`
**Text:**
The shuttle docks with the 'SS Theseus' with a percussive jolt that feels final. For ten years, you have been Dr. Aris Thorne, the pariah of Althea Corporation's Xenotech division. Ten years since your sensor array, your magnum opus, supposedly malfunctioned and claimed 117 souls. The official report was 'catastrophic systems failure.' You never believed it. Now, against all odds, you are back. The comm crackles with the voice of the recovery captain—a man who clearly despises you. "She's all yours, Thorne. Find something to justify this circus."
**Image Prompt:**
Sci-fi horror concept art. A middle-aged man, his face etched with a decade of failure and obsession, looks out the viewport of a cramped, utilitarian shuttle. Reflected in the glass, the immense, silent hull of the derelict starship 'SS Theseus' fills the view, eclipsing the distant stars.
**Choices:**
*   **"Cycle the airlock. Go aboard."**: -> `transition_boarding`

---

## Part 2: The Eerie Calm

### Node: `transition_boarding`
**Text:**
[Auto-Transition] You take a steadying breath, the recycled air of the shuttle tasting of ozone and finality. You initiate the airlock sequence. The hiss of equalizing pressure is the first sound the 'Theseus' has made in a decade.
**Image Prompt:**
Sci-fi horror concept art. First-person view from inside a helmet. A gloved hand rests on a large, illuminated button labeled 'CYCLE AIRLOCK'. Through the thick glass of the inner airlock door, the dark, silent corridor of the 'Theseus' waits.
**Choices:**
*   **"Continue..."**: -> `board_ship`

### Node: `board_ship`
**Text:**
You step aboard. The silence is the first thing that hits you. It's not just quiet; it's a dead, pressurized absence of sound. The emergency lights cast a sterile, clinical glow on surfaces clean enough to eat off of. No signs of violence, no system shorts, no bodies. It's a ghost ship, preserved in a vacuum. Your datapad pings with the ship's layout. The Bridge holds the key to the ship's final moments. The Server Room holds the crew's last words.
**Image Prompt:**
Sci-fi horror concept art. First-person view. The interior of the SS Theseus is pristine and unnervingly clean. Sterile emergency lights stretch down a long, metallic corridor. The scene is perfectly composed and symmetrical, creating a deep sense of unease. The only thing out of place is a single, drifting particle of dust in the air.
**Choices:**
*   **"Proceed to the Bridge."**: -> `go_to_bridge`
*   **"Descend to the Server Room."**: -> `go_to_server_room`

### Node: `go_to_bridge`
**Text:**
You ascend to the Bridge. The command center is a tomb of dead consoles, each one a dark mirror reflecting your solitary figure. In the center of the room, one panel remains stubbornly alive: the master control for the Theseus Array, your creation. It pulses with a soft, hypnotic light, displaying a data pattern you've never seen before.
**Image Prompt:**
Sci-fi horror concept art. The cavernous bridge of the starship Theseus is shrouded in darkness. In the dead center, a lone console for the advanced sensor array is illuminated, its screen casting a soft, blue, hypnotic light on the dust-covered captain's chair before it.
**Choices:**
*   **"Analyze the array's active logs."**: -> `access_sensor_logs`
*   **"Run a ship-wide environmental diagnostic first."**: -> `check_environmentals`

### Node: `go_to_server_room`
**Text:**
You take the lift down to the server room. The chill in the air is palpable. Monolithic server racks stand in silent rows, their own kind of graveyard. You access the central terminal, attempting to recover the crew's personal logs. Most are gone—a cascade of data corruption—but you manage to isolate the final, fragmented audio file from the captain.
**Image Prompt:**
Sci-fi horror concept art. A vast, dark, and cold server room. Endless rows of silent, monolithic server racks create a sense of oppressive scale. A single computer terminal glows in the darkness, its light illuminating the determined face of the person accessing it.
**Choices:**
*   **"Play the captain's last message."**: -> `read_log`

---

## Part 3: The Whispers

### Node: `read_log`
**Text:**
You play the file. Captain Eva Rostova's voice, frantic and broken: "Thorne, if you get this... your machine... it wasn't a failure. It was a success. A horrifying success. We pointed it at the void and the void... answered. It's not a signal, Aris, it's a... presence. It's in the walls. It's in our heads..." The log dissolves into a string of terrified, incoherent whispers, then a final, sharp scream. As silence falls, a voice—impossibly close—whispers your name in your own ear. "A...ris..."
**Image Prompt:**
Surrealist horror art. A soundwave visualization on a dark computer screen glitches and distorts violently. For a split second, the waveform contorts into the shape of a screaming human skull. The reflection in the screen shows the protagonist recoiling in shock.
**Choices:**
*   **"It's an auditory hallucination. Stress-induced psychosis."**: -> `go_to_bridge_from_server`
*   **"That was real. Brace your mind. Resist it."**: -> `failure_fight_it`

### Node: `failure_fight_it` (FAILURE LOOP)
**Text:**
"No," you snarl, gritting your teeth. You try to erect a mental barrier, to focus your thoughts. The whisper chuckles, a sound like grinding static. "Your thoughts," it mocks, "are so... loud." The pressure in your skull becomes an unbearable, white-hot spike. The server racks ripple like liquid. A warm trickle of blood escapes your nose. Your mind is a fortress with its gates thrown wide open.
**Image Prompt:**
Psychological horror art. An extreme close-up of a human eye, bloodshot and wide with agony. A single tear, black as oil, rolls down the cheek. Reflected in the pupil is an abstract, swirling vortex of dark, chaotic energy.
**Choices:**
*   **"Collapse..."**: -> `board_ship` (Loops back to a point where you have knowledge, but before the choice)

### Node: `go_to_bridge_from_server`
**Text:**
[Auto-Transition] You dismiss the whisper as a symptom of stress and isolation. Psychosis is a known risk of solo deep-space ops. You need hard data, not phantom voices. You leave the server room, your jaw set, and head for the Bridge to confront the source of the malfunction yourself.
**Image Prompt:**
Sci-fi horror concept art. First-person view of the protagonist marching down a sterile corridor, their fists clenched at their sides. Their breathing is heavy and audible inside the helmet. A sign on the wall points towards 'THE BRIDGE'.
**Choices:**
*   **"Continue..."**: -> `go_to_bridge`

---

## Part 4: The Truth

### Node: `check_environmentals`
**Text:**
Before touching the array, you run a diagnostic on the environmental systems. The console flashes a critical alert you almost missed: 'CO2 Scrubber Filter Efficiency: 15%. Total System Failure Imminent.' The air is turning toxic by the second. You have maybe an hour, tops.
**Image Prompt:**
Sci-fi horror concept art. A close-up on a grimy computer console. A bright red warning box flashes with the text: 'WARNING: LETHAL ATMOSPHERE DETECTED. IMMEDIATE ACTION REQUIRED.' The screen is filled with rapidly declining graphs.
**Choices:**
*   **"An hour is too long. I must find new filters in Life Support now."**: -> `go_to_life_support`
*   **"Time is short, which is why I must access the logs immediately."**: -> `access_sensor_logs`

### Node: `failure_suffocate` (FAILURE LOOP)
**Text:**
You ignore the warning, convinced the array holds the immediate answers. You throw yourself into decrypting the logs, your mind racing. Time blurs. Your vision begins to swim, your thoughts growing sluggish. A dull ache in your temples blossoms into a pounding headache. You look up from the console, gasping, finally realizing your fatal error. The air is thick and heavy. You claw at your collar, your lungs burning. Your last sight is the beautiful, deadly pattern on the sensor screen.
**Image Prompt:**
Psychological horror art. First-person view from a collapsing perspective. The edges of the vision are vignetted and dark. The hands in front of your face are pale and trembling. The computer console in the distance is a blurry, out-of-focus mess of light. A single red alert light is the last thing you see clearly.
**Choices:**
*   **"Fade to black..."**: -> `go_to_bridge` (Loops back to the choice)

### Node: `access_sensor_logs`
**Text:**
[Auto-Transition] You lean over the console, your reflection staring back from the dark screen. You begin the decryption sequence, a complex cypher of your own design. As the code scrolls past, a flicker of movement in the reflection catches your eye. A tall, distorted shadow, standing right behind you. You whip around. Nothing. Just the oppressive silence of the bridge.
**Image Prompt:**
Sci-fi horror concept art. A tense close-up of the protagonist's face, illuminated by the green glow of a computer screen filled with scrolling code. Reflected in the dark screen, standing directly behind the protagonist's shoulder, is the tall, wavering, and deeply unsettling silhouette of a non-human entity.
**Choices:**
*   **If you came from `go_to_bridge`**: -> `reveal_no_timer`
*   **If you came from `check_environmentals`**: -> `failure_suffocate`

### Node: `reveal_no_timer`
**Text:**
The final layer of encryption falls away. The log is not a diagnostic; it's a recording. It shows the Theseus's sensor array targeting a patch of seemingly empty space. Then, a wave of incandescent, non-Euclidean energy washes over the ship. The log displays the crew's biometric data; as the wave hits, every single crew member's brain activity spirals into instantaneous, violent chaos. You see security footage: the crew, screaming, turning on each other, tearing at their own faces. Your machine didn't fail. It found something. And it has led that something straight to you.
**Image Prompt:**
Cosmic horror art. A holographic star map displays a wave of impossible, fractal energy washing over a schematic of the starship Theseus. Beside the map, dozens of synced biometric displays simultaneously flatline after showing a burst of chaotic, peaked brain activity.
**Choices:**
*   **"My God. It's real. I have to stop it."**: -> `the_only_way`

---

## Part 5: The Climax

### Node: `the_only_way`
**Text:**
The realization crashes over you. The entity isn't just on the ship; it's in the systems, it's in the walls, it's wearing the silence like a glove. You can feel its ancient, alien mind pressing against your own, tasting your guilt, savoring your fear. You can't fight it with force. You can't outrun it. But the array... the array is a gateway. A gateway that can be opened, but also... re-purposed. You see the only way out. A terrible, final solution.
**Image Prompt:**
Psychological horror art. The protagonist stands before the glowing sensor console, their face a mask of grim, terrible resolve. Their reflection in the screen is warped and overlaid with swirling, ethereal energy. Their hand, shaking but determined, reaches for the master control panel.
**Choices:**
*   **"Become the prison. Repurpose the array."**: -> `prepare_sacrifice`

### Node: `prepare_sacrifice`
**Text:**
You throw yourself at the console, fingers flying across the interface, rewriting core functions. The entity knows. The whispers become a psychic roar. The ship groans, metal stressing under an unseen force. Hallucinations bombard you: the desiccated, accusing faces of the crew; the voice of your family, begging you to come home. You grit your teeth, shutting it all out. You are not building a weapon. You are building a cage, and your consciousness will be the bars.
**Image Prompt:**
Sci-fi horror concept art. The protagonist is a blur of frantic motion, working at a glowing console. The world around them is dissolving into a nightmare landscape, with ghostly, screaming figures made of static and light swirling in the air like a vortex.
**Choices:**
*   **"Initiate the broadcast. This is my final protocol."**: -> `sacrificial_broadcast`

---

## Part 6: The End

### Node: `sacrificial_broadcast`
**Text:**
You slam the final command into place. A wave of pure, silent, white energy erupts from the console, not burning, but consuming. There is no pain. There is... everything. Every memory, every regret, your mother's smile, the sting of your disgrace, the taste of coffee, the feeling of loss—all of it, your entire being, is unspooled and woven into an infinitely complex, repeating signal. A broadcast of a soul. You feel the parasite latch onto the signal, a starving god finding an eternal feast. It is trapped. And so are you.
**Image Prompt:**
Abstract, surrealist art. A human silhouette made of pure, white light and energy seems to be dissolving into an infinitely repeating, beautiful, and terrifying fractal pattern. At the very center of the silhouette's chest is a single point of absolute darkness, the trapped entity.
**Choices:**
*   **"..."**: -> `end_state`

### Node: `end_state`
**Text:**
The SS Theseus is silent once more. The emergency lights hum their endless, sterile tune. On the bridge, the master sensor array glows with a new, steady, and beautiful pattern—the intricate, looping consciousness of Dr. Aris Thorne. The monster is contained. The ship is a tomb, but it is also a prison. Nothing is truly solved, but the thread of the story is cut. Humanity is safe. For now.
**Image Prompt:**
Sci-fi horror concept art. The bridge of the Theseus is silent and still. The single, glowing console now displays a steady, peaceful, yet infinitely complex pattern of light. Dust motes dance in the low light. The ship is quiet. A tomb floating in the endless dark.
**Choices:**
*   **"Start Again?"**: -> `start`

---
## Part 7: Auxiliary Path (Life Support)

### Node: `go_to_life_support`
**Text:**
[Auto-Transition] You abandon the bridge and race towards the Life Support section, the ship's schematics guiding you through the sterile corridors. The thought of the air thinning with every breath adds a new, primal layer of fear to the situation.
**Image Prompt:**
Sci-fi horror concept art. First-person view of an astronaut running down a long, metallic corridor. Red alert lights are flashing, reflecting off the polished floor. The corridor is labeled 'LIFE SUPPORT' in a stark, utilitarian font.
**Choices:**
*   **"Continue..."**: -> `life_support_room`

### Node: `life_support_room`
**Text:**
You find the Life Support chamber, a maze of pipes and humming machinery. You locate the primary CO2 scrubber unit. The filter housing is sealed tight with bolts that have rusted from a decade of disuse. This is going to be a fight.
**Image Prompt:**
Sci-fi horror concept art. A massive, complex piece of industrial machinery covered in pipes and valves. A single panel is glowing red, marked 'FILTER ACCESS'. The bolts on the panel are visibly rusted and corroded, one of them stripped.
**Choices:**
*   **"Spend the time to replace the filters."**: -> `fix_scrubbers`

### Node: `fix_scrubbers`
**Text:**
It takes precious minutes, your muscles straining, but you finally break the rusted bolts and swap the clogged filter with a fresh one from the emergency locker. The system hums to life, and the critical warning on your datapad winks out. The air is safe. With the threat of suffocation gone, you can now investigate the mystery of the array without a clock ticking over your head.
**Image Prompt:**
Sci-fi concept art. The protagonist is wiping sweat from their brow, holding a new, clean air filter. In the background, the life support machinery is humming with steady green indicator lights. A sense of relief and renewed purpose.
**Choices:**
*   **"Return to the Bridge."**: -> `go_to_bridge_after_fix`

### Node: `go_to_bridge_after_fix`
**Text:**
You return to the bridge, the ship's air now clean and stable. The sensor console is still there, its hypnotic pattern waiting for you, seeming to pulse with a quiet malevolence.
**Image Prompt:**
Sci-fi horror concept art. The bridge of the starship Theseus, dark and silent. In the center of the room, the single console for the advanced sensor array is illuminated, its screen displaying a complex, slowly shifting, and hypnotic pattern of light. It feels more menacing now.
**Choices:**
*   **"Analyze the array's active logs."**: -> `access_sensor_logs`
