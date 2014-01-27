id3lib for nodejs
=================

Licence
-------------
This work is licensed under the Creative Commons Attribution-NonCommercial 3.0 Unported License. 
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/.

About
-------------
This library is a basic id3lib for reading (and maye writing in future) id3 information of mp3 files.

It is completely written in js and does not has any external dependencies. No external binary tools are needed.

What it is able to
-------------
* read id3v1 Tags (nearly all fields)
* read id3v2.2 Tags
* read id3v2.3 Tags
* read id3v2.4 Tags
* id3v2
 * detect extendet headers
 * extract id3v2 frames
 * decode text frames
 * unzip gzipped frames
 * extendable by registry structure for frame interpretation
