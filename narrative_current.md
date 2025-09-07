# Narrative Document: The Erebus Incident

This document is an auto-generated representation of the story defined in `story.json`. It reflects the current state of the in-game narrative, including all narrative polish and style unification.

---

### Node: `start`

**Text:**
> In the cold, silent expanse of deep space, a lone rescue shuttle drifts towards the ghost-like silhouette of the derelict starship, SS Erebus.

**Image Prompt:**
> A vast, cinematic shot of deep space. A small, rugged, utilitarian rescue shuttle is dwarfed by the immense, dark, and derelict form of the 'SS Erebus' starship. The starship is silent, with no lights, showing signs of damage and neglect. The shuttle is approaching it cautiously. The mood is tense and isolated.

**Choices:**
*   **"Continue..."**: -> `opening_zoom`

**Properties:**
*   `auto_transition`: true

---

### Node: `opening_zoom`

**Text:**
> The shuttle's cockpit comes into view, a tiny bubble of light against the vast, dead hulk of the Erebus.

**Image Prompt:**
> Cinematic shot, zooming in from the previous scene. The camera is now focused on the cockpit window of the small rescue shuttle. The immense, dark shape of the Erebus looms in the background, its scale still apparent.

**Choices:**
*   **"Continue..."**: -> `opening_cockpit`

**Properties:**
*   `auto_transition`: true

---

### Node: `opening_cockpit`

**Text:**
> The shuttle docks with the 'SS Erebus' with a percussive jolt that feels final. For ten years, you have been Dr. Aris Thorne, the pariah of Althea Corporation's Xenotech division. Ten years since your sensor array, your magnum opus, supposedly malfunctioned and claimed 117 souls.

**Image Prompt:**
> Dr. Aris Thorne looks out the viewport of a cramped, utilitarian shuttle. Reflected in the glass, the immense, silent hull of the derelict starship 'SS Erebus' fills the view, eclipsing the distant stars.

**Choices:**
*   **"Continue..."**: -> `protagonist_intro_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `protagonist_intro_2`

**Text:**
> The official report was 'catastrophic systems failure.' You never believed it. Now, against all odds, you are back.

**Image Prompt:**
> Continue the previous shot, but zoom in slightly on Dr. Aris Thorne's face, emphasizing the grim determination in his eyes. The reflection of the derelict ship remains dominant.

**Choices:**
*   **"Continue..."**: -> `protagonist_intro_3`

**Properties:**
*   `auto_transition`: true

---

### Node: `protagonist_intro_3`

**Text:**
> The comm crackles with the voice of the recovery captain—a man who clearly despises you. "She's all yours, Thorne. Find something to justify this circus."

**Image Prompt:**
> First-person view from the protagonist's perspective. A hand rests near the airlock controls. A small, crackling speaker grille is visible on the console, perhaps with a blinking light indicating an incoming transmission.

**Choices:**
*   **"Continue..."**: -> `transition_boarding`

**Properties:**
*   `auto_transition`: true

---

### Node: `title_card`

**Text:**
> EREBUS

**Image Prompt:**
> An epic, cinematic title card. The word 'EREBUS' is written in a stark, futuristic, and slightly distressed font. The background is a dark, subtly textured image that evokes a sense of deep space and cosmic horror. The lighting is minimal and dramatic.

**Choices:**
*   **"Continue..."**: -> `title_card`

**Properties:**
*   `auto_transition`: true

---

### Node: `transition_boarding`

**Text:**
> You take a steadying breath. The airlock hisses open, revealing the corridor beyond.

**Image Prompt:**
> First-person view from inside a helmet. Through the thick glass of the now-open inner airlock door, the corridor of the SS Erebus is revealed. It is a wreck. Emergency lights flicker erratically, casting deep shadows. Wires hang from the ceiling like vines, and panels are torn from the walls.

**Choices:**
*   **"Continue..."**: -> `hallway_flash`

**Properties:**
*   `auto_transition`: true
*   `no_context`: true

---

### Node: `hallway_flash`

**Text:**
> You blink, your eyes adjusting to the harsh light. For a moment, the scene ripples, like a faulty hologram. The flickering lights stabilize. The hanging wires retract. The torn panels seem to mend themselves before your very eyes.

**Image Prompt:**
> The same wrecked corridor, but it is glitching violently. A wave of digital static washes over the scene, and in its wake, the corridor is transforming into a pristine, clean, and sterile environment. The transition is caught mid-frame, with half the corridor wrecked and half perfectly clean.

**Choices:**
*   **"Continue..."**: -> `board_ship`

**Properties:**
*   `auto_transition`: true
*   `no_context`: true

---

### Node: `board_ship`

**Text:**
> You step aboard. The silence is the first thing that hits you. It's not just quiet; it's a dead, pressurized absence of sound. The emergency lights cast a sterile, unwavering glow. The ship is pristine, a ghost preserved in a vacuum. Was the damage you saw just a trick of the light? Your datapad pings with the ship's layout, highlighting several key areas: the Bridge, the Server Room, the Med Bay, Engineering, and the Crew Quarters.

**Image Prompt:**
> First-person view. The interior of the SS Erebus is pristine and unnervingly clean. Sterile emergency lights stretch down a long, metallic corridor. The scene is perfectly composed and symmetrical, creating a deep sense of unease. There is no dust. There is no damage. It is perfect.

**Choices:**
*   **"Proceed to the Bridge."**: -> `transition_to_bridge`
*   **"Descend to the Server Room."**: -> `transition_to_server_room`
*   **"Investigate the Med Bay."**: -> `transition_to_med_bay`
*   **"Check the ship's Engineering bay."**: -> `go_to_engineering`
*   **"Search the Crew Quarters."**: -> `go_to_crew_quarters`

---

### Node: `transition_to_bridge`

**Text:**
> You head towards the command center, taking a lift upwards through the ship's spine.

**Image Prompt:**
> Interior of a futuristic, cylindrical glass elevator ascending. Through the glass, the vast, complex inner structures of the starship can be seen. The lighting is sterile and cold, and for a moment, a fleeting, distorted shadow seems to move in the periphery.

**Choices:**
*   **"Continue..."**: -> `go_to_bridge`

**Properties:**
*   `auto_transition`: true

---

### Node: `transition_to_server_room`

**Text:**
> You take a lift down into the guts of the ship, the temperature dropping with each level you descend.

**Image Prompt:**
> Interior of a futuristic, industrial-style freight elevator descending into darkness. The walls are heavy, riveted metal. The only light comes from a dim, caged bulb overhead, casting long, dancing shadows that play tricks on the eyes.

**Choices:**
*   **"Continue..."**: -> `go_to_server_room`

**Properties:**
*   `auto_transition`: true

---

### Node: `transition_to_med_bay`

**Text:**
> You follow the signs on the wall, your footsteps echoing in the unnervingly quiet corridors.

**Image Prompt:**
> A long, sterile, white corridor on a starship. The corridor is empty and eerily silent. A sign on the wall, written in a clean, sans-serif font, points ahead with an arrow and the word 'MED BAY'. The silence is so profound it feels like a physical presence.

**Choices:**
*   **"Continue..."**: -> `go_to_med_bay`

**Properties:**
*   `auto_transition`: true

---

### Node: `go_to_bridge`

**Text:**
> You ascend to the Bridge. The command center is a tomb of dead consoles. As you step inside, you see a flicker in the corner of your eye—a flash of rust and decay on a console, gone as quickly as it appeared.

**Image Prompt:**
> The cavernous bridge of the starship Erebus is shrouded in darkness. For a split second, one of the 'dead' consoles in the foreground glitches, showing a screen cracked and covered in grime, before returning to its pristine, dark state.

**Choices:**
*   **"Continue..."**: -> `go_to_bridge_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `go_to_bridge_2`

**Text:**
> In the center of the room, one panel remains stubbornly alive: the master control for the Erebus Array, your creation. It pulses with a soft, hypnotic light, displaying a data pattern you've never seen before.

**Image Prompt:**
> Continuing from the previous shot, zoom in on the lone, active console. Its screen casts a soft, blue, hypnotic light on the dust-covered captain's chair before it.

**Choices:**
*   **"Analyze the array's active logs."**: -> `access_sensor_logs`
*   **"Run a ship-wide environmental diagnostic first."**: -> `check_environmentals`
*   **"Just start pushing buttons. See what happens."**: -> `failure_vent_atmosphere_1`

---

### Node: `failure_vent_atmosphere_1`

**Text:**
> Patience was never your strong suit. You stride over to a secondary console, its screen dark, and jab a promising-looking illuminated button labeled 'MANUAL OVERRIDE'. A klaxon suddenly blares, and the main screen flashes a new, terrifying message: 'EMERGENCY ATMOSPHERIC VENTING INITIATED: BRIDGE'.

**Image Prompt:**
> A close-up on a hand slamming a large, red, illuminated button on a dark console. The main viewscreen on the bridge in the background is now flashing with a huge, red warning symbol and the text 'WARNING: ATMOSPHERIC VENTING IN PROGRESS'. Red klaxon lights are flashing.

**Choices:**
*   **"Continue..."**: -> `failure_vent_atmosphere_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `failure_vent_atmosphere_2`

**Text:**
> A violent roar fills the bridge as the air is ripped from the room. Loose items are torn from the consoles and sucked towards a newly opened vent in the ceiling. The pressure in your suit spikes, and your vision tunnels as you are thrown against the console. Your last, desperate thought is of your own foolishness.

**Image Prompt:**
> First-person view of being violently thrown against a console on the bridge. The world is tilted and blurry. Debris and papers are flying through the air towards a vent in the ceiling. A spiderweb of cracks appears on the player's helmet visor.

**Choices:**
*   **"Gasp for a breath that will never come..."**: -> `go_to_bridge_2`

---

### Node: `bridge_knowledge_gap`

**Text:**
> You stare at the console, at the swirling, alien data. A profound sense of unease washes over you. You feel like you're missing a crucial piece of the puzzle. Trying to decrypt this now, blind, feels... reckless. That strange, hissing sound you heard in the server room, the grim findings in the med bay... maybe they hold the key.

**Image Prompt:**
> Dr. Aris Thorne stands before the glowing console, his expression one of deep uncertainty and dread. His hand hovers over the controls, hesitant. The reflection in the screen is distorted, showing a dark, questioning shadow of themselves.

**Choices:**
*   **"I should know more. I'll check the Server Room."**: -> `go_to_server_room`
*   **"Perhaps the Med Bay has answers about the crew."**: -> `go_to_med_bay`
*   **"Ignore the feeling. Push forward with the decryption."**: -> `failure_blind_decryption`

---

### Node: `failure_blind_decryption`

**Text:**
> You shake off the doubt, attributing it to stress. You're a scientist. You need data, not feelings. You initiate the decryption sequence. As the alien code begins to resolve, your mind feels... open. An intrusive, chilling presence slips into your thoughts, uninvited.

**Image Prompt:**
> Cinematic sci-fi horror: A first-person view of a computer screen with alien, glowing glyphs. The glyphs are starting to bleed off the screen, swirling into the air around the console, as if trying to reach for the viewer.

**Choices:**
*   **"Continue..."**: -> `failure_blind_decryption_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `failure_blind_decryption_2`

**Text:**
> The whispers start, not in your ear, but inside your skull. You've connected yourself to the entity without any mental defenses. It floods your consciousness, and you are lost in the terrible, beautiful static of its thoughts.

**Image Prompt:**
> Cinematic sci-fi horror: The first-person view continues, but the user's hands, visible at the bottom of the frame, are starting to become translucent and made of shimmering, colorful static. The world beyond the console is dissolving into a whirlwind of abstract energy.

**Choices:**
*   **"Become one with the void..."**: -> `start`

---

### Node: `go_to_server_room`

**Text:**
> You take the lift down into the guts of the ship. The chill in the air is palpable. Monolithic server racks stand in silent, perfect rows. But as you walk past, your reflection in a polished panel seems to show the metal as-corroded and ancient for a brief moment.

**Image Prompt:**
> A vast, dark, and cold server room. Endless rows of silent, monolithic server racks create a sense of oppressive scale. The reflection of the protagonist on the side of one of the racks is subtly wrong: the reflection shows the rack as rusted and covered in cobwebs.

**Choices:**
*   **"Access the central terminal."**: -> `server_access_terminal`
*   **"Return to the main corridor."**: -> `board_ship`

---

### Node: `server_access_terminal`

**Text:**
> You access the central terminal. Most of the data is a maelstrom of corruption. You manage to locate the captain's final log, but it's flagged as 'Potentially Corrupted'. The system warns you that attempting to access it might cause... instability.

**Image Prompt:**
> A futuristic computer terminal in a dark server room. The screen is filled with scrolling, corrupted data that looks like digital static. A single dialog box in the center reads: 'WARNING: Data integrity compromised. Access may cause system instability. Proceed?'

**Choices:**
*   **"Bypass the corruption filters and play the log."**: -> `server_bypass_corruption`
*   **"Leave the terminal."**: -> `go_to_server_room`

---

### Node: `server_bypass_corruption`

**Text:**
> You override the safety protocols. For a moment, the terminal screen floods with a pattern of crystalline static that feels horribly familiar. The lights in the server room flicker violently, and a wave of dizziness washes over you. Then, the captain's audio log begins to play.

**Image Prompt:**
> The computer terminal screen is a blast of pure, white, crystalline static. The light from the screen is the only light in the room, casting harsh, flickering shadows. The first-person view is distorted at the edges, as if the player is experiencing intense vertigo.

**Choices:**
*   **"Continue..."**: -> `read_log`

**Properties:**
*   `auto_transition`: true

---

### Node: `read_log`

**Text:**
> The captain's voice crackles, frantic and broken. "Thorne, if you get this... your machine... it wasn't a failure. It was a success. That 'unknown power source' we detected in Engineering? We pointed the array at it. We awoke something. Something that was sleeping in the void. It's not a signal, Aris, it's a... presence."

**Image Prompt:**
> A close-up on a computer screen showing an audio file being played. The waveform is erratic and sharp. The reflection on the screen shows the focused, tense face of Dr. Aris Thorne. For a split second, the ghostly, superimposed face of Captain Eva Rostova, her expression terrified, appears over the waveform.

**Choices:**
*   **"Continue..."**: -> `read_log_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `read_log_2`

**Text:**
> "It's not a signal, Aris, it's a... presence. It's in the walls. It's in our heads..." The log dissolves into a string of terrified, incoherent whispers, then a final, sharp scream.

**Image Prompt:**
> The soundwave on the screen violently glitches and distorts, for a split second contorting into the shape of a screaming human skull. Dr. Aris Thorne's reflection shows him recoiling in shock.

**Choices:**
*   **"Continue..."**: -> `read_log_3`

**Properties:**
*   `auto_transition`: true

---

### Node: `read_log_3`

**Text:**
> As silence falls, you hear a sound—impossibly close, yet seeming to come from everywhere at once. It's a soft, sibilant hiss, like a billion tiny particles of ice rubbing together. And in the static, you almost think you can hear a voice... your own voice... trying to say your name.

**Image Prompt:**
> Extreme close-up on Dr. Aris Thorne's ear and the side of his face. His eyes are wide with confusion and dawning fear, not reacting to a simple sound, but to an impossible sensory input. The background is the dark, out-of-focus server room. The lighting is tight and claustrophobic.

**Choices:**
*   **"It's an auditory hallucination. Stress-induced psychosis."**: -> `go_to_bridge_from_server`
*   **"That was real. Brace your mind. Resist it."**: -> `failure_fight_it`

---

### Node: `failure_fight_it`

**Text:**
> "No," you snarl, gritting your teeth as you try to erect a mental barrier. The whisper chuckles, a sound like grinding static. "Your thoughts," it mocks, "are so... loud." The pressure in your skull becomes an unbearable, white-hot spike.

**Image Prompt:**
> Dr. Aris Thorne is on his knees, clutching his head in agony. The server racks around them are starting to ripple and distort as if seen through a heat haze. Ghostly, static-like tendrils of energy are reaching for his head.

**Choices:**
*   **"Continue..."**: -> `failure_fight_it_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `failure_fight_it_2`

**Text:**
> The server racks ripple like liquid. A wave of vertigo hits you, and your vision blurs. Your mind is a fortress with its gates thrown wide open. The last thing you see is the server room dissolving into a vortex of screaming data.

**Image Prompt:**
> An extreme close-up of a human eye, wide with agony. The pupil dilates, reflecting an abstract, swirling vortex of dark, chaotic energy and screaming digital faces.

**Choices:**
*   **"Collapse..."**: -> `board_ship`

---

### Node: `go_to_bridge_from_server`

**Text:**
> You dismiss the whisper as a symptom of stress and isolation. You need hard data, not phantom voices. You leave the server room and head for the Bridge to confront the source of the malfunction yourself.

**Image Prompt:**
> First-person view of the protagonist marching purposefully down a sterile corridor, their fists clenched at their sides. A sign on the wall points towards 'THE BRIDGE'.

**Choices:**
*   **"Continue..."**: -> `go_to_bridge`

**Properties:**
*   `auto_transition`: true

---

### Node: `check_environmentals`

**Text:**
> Before touching the array, you run a diagnostic on the environmental systems. The console flashes a critical alert you almost missed: 'CO2 Scrubber Filter Efficiency: 15%. Total System Failure Imminent.' The air is turning toxic by the second. You have maybe an hour, tops.

**Image Prompt:**
> A close-up on a grimy computer console. A bright red warning box flashes with the text: 'WARNING: LETHAL ATMOSPHERE DETECTED. IMMEDIATE ACTION REQUIRED.' The screen is filled with rapidly declining graphs.

**Choices:**
*   **"An hour is too long. I must find new filters in Life Support now."**: -> `go_to_life_support`
*   **"Time is short, which is why I must access the logs immediately."**: -> `failure_suffocate`

---

### Node: `failure_suffocate`

**Text:**
> You ignore the warning, convinced the array holds the key. You throw yourself into decrypting the logs. Time blurs. Your vision begins to swim, your thoughts growing sluggish. A dull ache in your temples blossoms into a pounding headache.

**Image Prompt:**
> Cinematic sci-fi horror: A first-person view of the console. The edges of the vision are starting to blur and vignette. The text on the screen is becoming difficult to read, slightly warped. A sense of dizziness and disorientation.

**Choices:**
*   **"Continue..."**: -> `failure_suffocate_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `failure_suffocate_2`

**Text:**
> You look up from the console, gasping, finally realizing your fatal error. The air is thick and heavy. You claw at your collar, your lungs burning. Your last sight is the beautiful, deadly pattern on the sensor screen, mocking you.

**Image Prompt:**
> Cinematic sci-fi horror: First-person view from a collapsing perspective. The hands in front of your face are pale and trembling, clawing at your throat. The computer console in the distance is a blurry, out-of-focus mess of light. A single red alert light on the console is the last thing you see clearly.

**Choices:**
*   **"Fade to black..."**: -> `go_to_bridge`

---

### Node: `access_sensor_logs`

**Text:**
> You lean over the console, your reflection staring back from the dark screen. You begin the decryption sequence. As the code scrolls past, a flicker of movement in the reflection catches your eye. It's not a shadow. For a split second, the reflection shows the bridge as it *really* is: a wrecked, derelict tomb, covered in a strange, crystalline frost that seems to absorb the light. Then it's gone. You whip around. Nothing. Just the oppressive, pristine silence.

**Image Prompt:**
> A tense close-up of Dr. Aris Thorne's face, illuminated by the green glow of a computer screen filled with scrolling code. Reflected in the dark screen is the bridge, but it is a scene of utter devastation. Wires spark, panels are broken. Most unsettlingly, a layer of impossible, fractal-like crystalline frost covers every surface, glowing with a faint, sickly light. There is no entity visible, only the ghostly, frozen aftermath of its presence.

**Choices:**
*   **"Continue..."**: -> `access_sensor_logs_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `access_sensor_logs_2`

**Text:**
> The final layer of encryption falls away. The log is not a diagnostic; it's a recording. It shows the Erebus's sensor array targeting a patch of seemingly empty space. Then, a wave of incandescent, non-Euclidean energy washes over the ship.

**Image Prompt:**
> A holographic star map displays a wave of impossible, fractal energy originating from a point in empty space and washing over a schematic of the starship Erebus.

**Choices:**
*   **"Continue..."**: -> `access_sensor_logs_3`

**Properties:**
*   `auto_transition`: true

---

### Node: `access_sensor_logs_3`

**Text:**
> The log displays the crew's biometric data. As the wave hits, every single crew member's biometric signature vanishes. Simultaneously. You see security footage: the crew, looking up as if they hear something, and then, one by one, they become translucent and fade away into nothing.

**Image Prompt:**
> A split-screen view. On the left, dozens of synced biometric displays simultaneously go blank, showing 'SIGNAL LOST'. On the right, a grainy security camera view shows the crew in a corridor suddenly looking up, then becoming translucent and fading away into nothingness.

**Choices:**
*   **"Continue..."**: -> `access_sensor_logs_4`

**Properties:**
*   `auto_transition`: true

---

### Node: `access_sensor_logs_4`

**Text:**
> Your machine didn't fail. It found something. And it has led that something straight to you. As the thought forms, the console screen wavers. The reflection of your own face distorts, the features momentarily twisting into an expression of silent, screaming agony that isn't your own.

**Image Prompt:**
> Return to the close-up of Dr. Aris Thorne's face, illuminated by the console screen. His eyes are wide with dawning horror and comprehension. His reflection in the screen is hideously distorted. For a moment, it is not his face, but a screaming, silent mask of agony, the features warped as if seen through water, with the same faint, crystalline frost seeming to crawl at the edges of the reflected image.

**Choices:**
*   **"My God. It's real. I have to stop it."**: -> `the_only_way`

---

### Node: `the_only_way`

**Text:**
> The realization crashes over you. The entity isn't just on the ship; it's in the systems, it's in the walls, it's wearing the silence like a glove. You can feel its ancient, alien mind pressing against your own, tasting your guilt, savoring your fear. You can't fight it with force. You can't outrun it. But the array... the array is a gateway. A gateway that can be opened, but also... re-purposed. You see the only way out. A terrible, final solution.

**Image Prompt:**
> Dr. Aris Thorne stands before the glowing sensor console, his face a mask of grim, terrible resolve. His reflection in the screen is warped and overlaid with swirling, ethereal energy. His hand, shaking but determined, reaches for the master control panel.

**Choices:**
*   **"Become the prison. Repurpose the array."**: -> `prepare_sacrifice`

---

### Node: `prepare_sacrifice`

**Text:**
> You throw yourself at the console, fingers flying across the interface, rewriting core functions. The entity knows. The whispers become a psychic roar. The ship groans, metal stressing under an unseen force.

**Image Prompt:**
> Dr. Aris Thorne is a blur of frantic motion, working at a glowing console. The bridge around him is shaking violently, with sparks flying from damaged consoles. The main screen shows complex code being rewritten at an impossible speed.

**Choices:**
*   **"Continue..."**: -> `prepare_sacrifice_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `prepare_sacrifice_2`

**Text:**
> Hallucinations bombard you: the desiccated, accusing faces of the crew; the voice of your family, begging you to come home. You grit your teeth, shutting it all out. You are not building a weapon. You are building a cage, and your consciousness will be the bars.

**Image Prompt:**
> A close up on Dr. Aris Thorne's face, which is a mask of grim, terrible resolve. His eyes are tightly shut. Superimposed over his face are ghostly, screaming figures made of static and light, representing the hallucinations.

**Choices:**
*   **"Initiate the broadcast. This is my final protocol."**: -> `sacrificial_broadcast`

---

### Node: `sacrificial_broadcast`

**Text:**
> You slam the final command into place. A wave of pure, silent, white energy erupts from the console, not burning, but consuming. There is no pain. There is... everything. Every memory, every regret, your mother's smile, the sting of your disgrace, the taste of coffee, the feeling of loss—all of it, your entire being, is unspooled and woven into an infinitely complex, repeating signal. A broadcast of a soul. You feel the parasite latch onto the signal, a starving god finding an eternal feast. It is trapped. And so are you.

**Image Prompt:**
> A silhouette of Dr. Aris Thorne, made of pure, white light and energy, seems to be dissolving into an infinitely repeating, beautiful, and terrifying fractal pattern. At the very center of the silhouette's chest is a single point of absolute darkness, the trapped entity.

**Choices:**
*   **"..."**: -> `end_glow_in_cabin`

---

### Node: `end_glow_in_cabin`

**Text:**
> The energy release is blinding. A wave of pure, silent, white light erupts from the console.

**Image Prompt:**
> A human silhouette made of pure, white light and energy seems to be dissolving into an infinitely repeating, beautiful, and terrifying fractal pattern. At the very center of the silhouette's chest is a single point of absolute darkness, the trapped entity. This is happening inside the bridge of the ship.

**Choices:**
*   **"Continue..."**: -> `end_outside_ship_close`

**Properties:**
*   `auto_transition`: true

---

### Node: `end_outside_ship_close`

**Text:**
> From outside, the ship is momentarily illuminated from within.

**Image Prompt:**
> A shot from just outside the SS Erebus, looking at the bridge viewport. A brilliant, white light erupts from within, starkly illuminating the hull and casting long shadows.

**Choices:**
*   **"Continue..."**: -> `end_outside_ship_far`

**Properties:**
*   `auto_transition`: true

---

### Node: `end_outside_ship_far`

**Text:**
> The light fades, leaving the ship once again adrift in the silent void.

**Image Prompt:**
> The camera has pulled back farther. The SS Erebus is a solitary vessel against the backdrop of a star-dusted nebula. The intense light from the bridge has subsided, returning the ship to a quiet silhouette.

**Choices:**
*   **"Continue..."**: -> `end_state`

**Properties:**
*   `auto_transition`: true

---

### Node: `end_state`

**Text:**
> The SS Erebus is silent once more. The emergency lights hum their endless, sterile tune. On the bridge, the master sensor array glows with a new, steady, and beautiful pattern—the intricate, looping consciousness of Dr. Aris Thorne. The monster is contained. The ship is a tomb, but it is also a prison. Nothing is truly solved, but the thread of the story is cut. Humanity is safe. For now.

**Image Prompt:**
> The bridge of the Erebus is silent and still. The single, glowing console now displays a steady, peaceful, yet infinitely complex pattern of light. Dust motes dance in the low light. The ship is quiet. A tomb floating in the endless dark.

**Choices:**
*   **"Start Again?"**: -> `start`

---

### Node: `go_to_life_support`

**Text:**
> You abandon the bridge and race towards the Life Support section, the ship's schematics guiding you through the sterile corridors. The thought of the air thinning with every breath adds a new, primal layer of fear to the situation.

**Image Prompt:**
> First-person view of an astronaut running down a long, metallic corridor. Red alert lights are flashing, reflecting off the polished floor. The corridor is labeled 'LIFE SUPPORT' in a stark, utilitarian font.

**Choices:**
*   **"Continue..."**: -> `life_support_room`

**Properties:**
*   `auto_transition`: true

---

### Node: `life_support_room`

**Text:**
> You find the Life Support chamber, a maze of pipes and humming machinery. You locate the primary CO2 scrubber unit. The filter housing is sealed tight with bolts that have rusted from a decade of disuse. This is going to be a fight.

**Image Prompt:**
> A massive, complex piece of industrial machinery covered in pipes and valves. A single panel is glowing red, marked 'FILTER ACCESS'. The bolts on the panel are visibly rusted and corroded, one of them stripped.

**Choices:**
*   **"Spend the time to replace the filters."**: -> `fix_scrubbers`

---

### Node: `fix_scrubbers`

**Text:**
> It takes precious minutes, your muscles straining, but you finally break the rusted bolts and swap the clogged filter with a fresh one from the emergency locker. The system hums to life, and the critical warning on your datapad winks out. The air is safe. With the threat of suffocation gone, you can now investigate the mystery of the array without a clock ticking over your head.

**Image Prompt:**
> Dr. Aris Thorne is wiping sweat from his brow, holding a new, clean air filter. In the background, the life support machinery is humming with steady green indicator lights. A sense of relief and renewed purpose.

**Choices:**
*   **"Return to the Bridge."**: -> `go_to_bridge_after_fix`

---

### Node: `go_to_bridge_after_fix`

**Text:**
> You return to the bridge, the ship's air now clean and stable. The sensor console is still there, its hypnotic pattern waiting for you, seeming to pulse with a quiet malevolence.

**Image Prompt:**
> The bridge of the starship Erebus, dark and silent. In the center of the room, the single console for the advanced sensor array is illuminated, its screen displaying a complex, slowly shifting, and hypnotic pattern of light. It feels more menacing now.

**Choices:**
*   **"Analyze the array's active logs."**: -> `access_sensor_logs`

---

### Node: `go_to_med_bay`

**Text:**
> You decide to check the Med Bay. The doors hiss open to reveal a scene of chilling sterility. But as the door slides, the pristine white walls seem to shimmer, and for a split-second, they are covered in a network of faint, glowing lines, like a schematic or a circuit board, before fading back to white.

**Image Prompt:**
> The automatic doors to the med bay are sliding open. For a split second, the pristine white wall inside is covered in a faint, glowing, and impossibly complex network of lines, like an alien circuit board or a glowing fungus. The pattern vanishes as the door opens fully to reveal a perfectly clean room.

**Choices:**
*   **"Access the medical log."**: -> `access_med_log`
*   **"Investigate the surgical theater."**: -> `med_bay_theater`

---

### Node: `med_bay_theater`

**Text:**
> You push through a set of double doors into the surgical theater. The room is dominated by a single operating table. The overhead light is buzzing, casting a harsh glare on the sterile surfaces. It's pristine, except for one thing: a surgical tray on a nearby table is in disarray, its instruments stained with a dark, dried substance.

**Image Prompt:**
> A sterile, white surgical theater on a starship. A single, intimidating operating table sits in the center under a harsh overhead light. On a metal tray nearby, surgical instruments are scattered in a chaotic mess, stained with dried blood. The scene is otherwise perfectly clean, which makes the bloody instruments even more disturbing.

**Choices:**
*   **"Examine the instruments."**: -> `examine_instruments`
*   **"Leave the theater."**: -> `go_to_med_bay`

---

### Node: `examine_instruments`

**Text:**
> You look closer at the instruments. They are scalpels, forceps, and... other things, things you don't recognize. They look less like medical tools and more like carving implements. You notice a faint, intricate pattern has been scratched into the metal of the operating table, almost hidden in the glare of the light.

**Image Prompt:**
> A close-up of the bloody surgical instruments. They are sharp, precise, and unsettling. In the background, out of focus, a series of strange, ritualistic-looking symbols can be seen scratched into the surface of the operating table.

**Choices:**
*   **"Pick up one of the carving tools."**: -> `failure_med_bay_compulsion`
*   **"This is a dark place. Leave now."**: -> `go_to_med_bay`

---

### Node: `failure_med_bay_compulsion`

**Text:**
> You reach for one of the tools. The moment your fingers touch the cold metal, a jolt goes through you. The 'song' you've been hearing, the faint static at the edge of your perception, becomes a deafening roar. You feel an overwhelming compulsion, a deep, horrifying *need* to make the patterns match... to carve the beautiful, terrible symbols from the table into your own skin.

**Image Prompt:**
> First-person view. The protagonist is holding one of the strange, bloody carving tools. Their hand is trembling violently. Their own arm is in the frame, and you can see the tip of the tool pressing against their skin, as if they are fighting an immense internal battle.

**Choices:**
*   **"Fight it. Drop the tool."**: -> `go_to_med_bay`

---

### Node: `access_med_log`

**Text:**
> It's the log of the ship's psychologist, Dr. Lena Hanson. Her notes chart the crew's rapid, inexplicable descent into paranoia. 'They all report the same thing,' she writes. 'A song. A cold, sharp song of crystal and static. They say it's in the walls, in their heads. I told them it was mass hysteria... but now... I'm hearing it too. It's beautiful. It's terrifying. It's calling to us from the void.'

**Image Prompt:**
> A close-up on a futuristic medical datapad. The screen shows the portrait of a concerned-looking female doctor next to a block of text. The text is a psychological evaluation, with phrases like 'mass hysteria', 'auditory hallucinations', and 'shared auditory phenomena' visible.

**Choices:**
*   **"Check the autopsy reports."**: -> `check_autopsy`

---

### Node: `check_autopsy`

**Text:**
> You find the medical report for the first crew member who vanished. The cause of death is listed as 'Undetermined.' The notes are chilling. 'Subject claimed something was 'calling' to them from the walls. Subject was last seen walking towards the outer hull. Security footage from the hallway simply shows them... fading. Vanishing into thin air.' A security image shows an empty corridor.

**Image Prompt:**
> A sterile, scientific medical report is displayed on a screen. The text is clinical, but a single security photo attached to the file is visible. The photo shows a grainy, empty corridor, with a faint, human-shaped distortion in the air, as if a person was fading from reality.

**Choices:**
*   **"This is too much. Leave the Med Bay."**: -> `leave_med_bay`
*   **"Access the secure medical cabinet."**: -> `failure_med_cabinet`

---

### Node: `failure_med_cabinet`

**Text:**
> You override the lock on the secure medical cabinet. A piercing alarm blares. A soft, female automated voice announces, 'Lethal contaminant protocol initiated.'

**Image Prompt:**
> A close-up on the protagonist's hand as they override a digital lock on a medical cabinet. The screen flashes red with the word 'OVERRIDE'. In the background, red alarm lights begin to strobe.

**Choices:**
*   **"Continue..."**: -> `failure_med_cabinet_2`

**Properties:**
*   `auto_transition`: true

---

### Node: `failure_med_cabinet_2`

**Text:**
> 'Medical bay is now under permanent quarantine.' With a deafening clang, a heavy steel door slams shut, sealing you inside. The main lights die.

**Image Prompt:**
> First-person view. A heavy, steel quarantine door, marked with yellow and black biohazard symbols, is slamming shut, plunging the room into near darkness. The only light is the single, flashing red alarm light, casting long, dramatic shadows.

**Choices:**
*   **"Continue..."**: -> `failure_med_cabinet_3`

**Properties:**
*   `auto_transition`: true

---

### Node: `failure_med_cabinet_3`

**Text:**
> The alarm cuts out, leaving you in an oppressive, ringing silence. You are trapped. Forever. A prisoner in a pristine tomb.

**Image Prompt:**
> A wide shot from inside the med bay, now pitch black except for the faint, rhythmic pulse of the red emergency light. The light glints off the sterile medical instruments, arranged with chilling precision on a nearby tray. The figure of the protagonist is a barely-visible silhouette in the oppressive darkness.

**Choices:**
*   **"Accept your fate..."**: -> `board_ship`

---

### Node: `leave_med_bay`

**Text:**
> You've seen enough. The Med Bay offers only horror. You back out, the doors hissing shut behind you, and resolve to find answers elsewhere.

**Image Prompt:**
> First-person view of the protagonist backing away from the sterile, white Med Bay. The automatic doors are sliding shut, sealing the horrors within.

**Choices:**
*   **"Continue..."**: -> `board_ship`

**Properties:**
*   `auto_transition`: true

---

### Node: `go_to_engineering`

**Text:**
> You head towards the stern of the ship, following signs for Engineering. The pristine corridors give way to a more industrial aesthetic. Heavy, grease-stained doors hiss open to reveal the heart of the ship.

**Image Prompt:**
> A massive, industrial engineering bay on a starship. Huge, silent machinery dominates the room. Everything is clean, but there's a sense of immense, dormant power. The lighting is colder and more utilitarian than in the rest of the ship. A single diagnostic panel glows in the distance.

**Choices:**
*   **"Approach the diagnostic panel."**: -> `engineering_panel`
*   **"Return to the main corridor."**: -> `board_ship`

---

### Node: `engineering_panel`

**Text:**
> The panel shows the power readings for the ship. The main reactor is offline, yet... the ship is drawing a trickle of power from somewhere. The source is listed as 'UNKNOWN'. The energy signature is a hungry, leech-like waveform, actively siphoning residual energy from the ship's systems.

**Image Prompt:**
> A close-up of a futuristic diagnostic screen. Most of the readouts are flatlined, but a single graph shows an aggressive, leech-like power draw. The label for this reading is a flashing red 'UNKNOWN SOURCE'. The energy wavelength is a complex, predatory-looking fractal pattern.

**Properties:**
*   `auto_flashback`: -> `flashback_engineering_start`

---

### Node: `flashback_engineering_start`

**Text:**
> The glowing panel... the fractal pattern... it triggers something in your memory. A fragment of a moment you weren't there for, but you feel as if you were...

**Image Prompt:**
> A distorted, dreamlike view of the Engineering bay, but it is bustling with activity. Engineers in jumpsuits are shouting, pointing at the same diagnostic screen you were just looking at. The image is blurry and overlaid with static.

**Choices:**
*   **"Continue..."**: -> `flashback_engineering_2`

**Properties:**
*   `auto_transition`: true
*   `style_override`: "flashback_echo"

---

### Node: `flashback_engineering_2`

**Text:**
> You hear Captain Rostova's voice over an intercom, sharp and clear through the memory-haze. 'Thorne was right. The array is working. What are we looking at, people?' An engineer replies, his voice full of awe. 'I don't know, Captain. It's... beautiful.'

**Image Prompt:**
> The same blurry, dreamlike scene, but now the focus is on the diagnostic screen. The 'UNKNOWN SOURCE' is not red and flashing, but a brilliant, beautiful, and hypnotic blue. The engineers are gathered around it, mesmerized. The ghost of Captain Rostova is faintly visible, looking on with a mix of triumph and concern.

**Choices:**
*   **"The memory fades..."**: -> `engineering_panel_loop` (`flashback_end`: true)

**Properties:**
*   `style_override`: "flashback_echo"

---

### Node: `engineering_panel_loop`

**Text:**
> You are back at the diagnostic panel. The parasitic waveform on the screen seems to pulse in time with your heartbeat. The memory you just experienced hangs heavy in the air. You now understand: the pristine state of the ship isn't preservation; it's consumption.

**Image Prompt:**
> A close-up of a futuristic diagnostic screen. The aggressive, leech-like power draw is still visible. The fractal pattern of the energy signature seems to subtly, slowly, change, as if adapting.

**Choices:**
*   **"Try to interface directly with the unknown signal."**: -> `failure_engineering_interface`
*   **"This is too dangerous. Leave Engineering."**: -> `go_to_engineering`

---

### Node: `failure_engineering_interface`

**Text:**
> You reach out, placing your hand on the screen. A jolt of ice-cold energy shoots up your arm. The room dissolves into a screaming vortex of crystalline light and fractured data. Your own thoughts are no longer your own. You are a part of the song now.

**Image Prompt:**
> First-person view. The protagonist's hand is on the screen, but it's turning into crystalline, fractal patterns. The world outside the screen is a swirling vortex of light and data, representing a total loss of self.

**Choices:**
*   **"Become part of the machine..."**: -> `go_to_engineering`

---

### Node: `go_to_crew_quarters`

**Text:**
> You make your way to the habitat ring of the ship. The corridors here feel different—less sterile, more lived-in, yet utterly silent. The doors to the crew quarters are closed, each with a small nameplate.

**Image Prompt:**
> A corridor in the crew quarters section of a starship. It's clean, but feels more personal than the main corridors. There are several doors, each with a small, unlit nameplate beside it. The silence is profound; it feels like you're walking through a graveyard.

**Choices:**
*   **"Enter the first room on the left."**: -> `quarters_room_1`
*   **"Read the nameplates on the doors."**: -> `quarters_nameplates`
*   **"Return to the main corridor."**: -> `board_ship`

---

### Node: `quarters_nameplates`

**Text:**
> You scan the names on the doors. Rostova. Hanson. Chen. Names you recognize from the crew manifest. There's no comfort in the familiarity.

**Image Prompt:**
> A close-up on a few of the nameplates on the doors. The names are simple, utilitarian text (ROSTOVA, E. HANSON, L. CHEN, J.). The metal is cold and sterile.

**Choices:**
*   **"Stop reading."**: -> `go_to_crew_quarters`

---

### Node: `quarters_room_1`

**Text:**
> You slide open the door. The room is small, spartan. A single bunk, a desk with a datapad, a small closet. Everything is perfectly neat, as if the occupant just stepped out for a moment.

**Image Prompt:**
> The interior of a spartan crew cabin on a starship. The bed is made with military precision. A datapad sits on a small desk. The room is clean and sterile, but a single item is out of place: a child's drawing of a smiling star, taped to the wall.

**Choices:**
*   **"Read the datapad."**: -> `quarters_datapad`
*   **"Leave the room."**: -> `go_to_crew_quarters`

---

### Node: `quarters_datapad`

**Text:**
> The datapad contains a single, unfinished letter. 'My dearest Elara, I don't know how to explain what's happening. We found something out there. Something wonderful, I thought. But it's... wrong. The ship... it sings to us now. A cold, sharp song of crystal and static. I see it when I close my eyes. I...' The letter ends there, the last word trailing off.

**Image Prompt:**
> A close-up on a datapad screen. The text of an unfinished letter is visible. The text is written in a slightly panicked, hurried hand. The screen flickers slightly, and for a moment, a faint, crystalline pattern seems to overlay the words.

**Properties:**
*   `auto_flashback`: -> `flashback_quarters_start`

---

### Node: `flashback_quarters_start`

**Text:**
> As you read the words 'My dearest Elara', the datapad screen seems to dissolve into light, pulling you into another memory...

**Image Prompt:**
> A distorted, dreamlike view of the same crew quarters, but the room is personalized. There are photos on the desk, clothes strewn on a chair. A man is sitting on the bunk, smiling as he talks to someone off-screen. The image is warm and happy, but hazy and ephemeral.

**Choices:**
*   **"Continue..."**: -> `flashback_quarters_2`

**Properties:**
*   `auto_transition`: true
*   `style_override`: "flashback_echo"

---

### Node: `flashback_quarters_2`

**Text:**
> A woman's voice, warm and full of laughter, says 'Tell Elara her papa is a hero. The whole universe is going to know his name.' The man on the bunk laughs. 'Let's not get ahead of ourselves. But this discovery... it's going to change everything.' The scene shimmers and fades, a ghostly echo of laughter in the silence.

**Image Prompt:**
> The same hazy, dreamlike room. The man is looking at a photo on his desk - a picture of a young girl. The scene is tinged with a deep, tragic sadness, as if the memory itself is aware of what is to come. The edges of the image are dissolving into white light.

**Choices:**
*   **"The memory recedes..."**: -> `quarters_datapad_after_flashback` (`flashback_end`: true)

**Properties:**
*   `style_override`: "flashback_echo"

---

### Node: `quarters_datapad_after_flashback`

**Text:**
> The memory fades, leaving you staring at the datapad. The unfinished letter now feels much more ominous, a ghostly echo of the hope the crew felt before it was all extinguished.

**Image Prompt:**
> A close-up on a datapad screen. The text of an unfinished letter is visible. The screen is static now, the faint crystalline pattern gone, but the words carry a new, heavier weight.

**Choices:**
*   **"Leave the room."**: -> `go_to_crew_quarters`

---
