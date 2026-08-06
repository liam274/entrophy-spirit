# Introspection Brain - An NNN Demo

This is a digital brain which will listen to the environment, think and output

## Experiment

We aim to simulate a brain that is similar to a human brain. Thus, to test our technology, we have accomplished a few tests:

| Audio                                                                                       | Result Path                                                      |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Random environment sound via file, such as typing, chatting(English) and air movement, etc. | [`expirement/random-sound/`](expirement/random-sound/)           |
| Silent environment sound via file, such as air movement,typing, breathing, cough, etc.      | [`expirement/silent-sound/`](expirement/silent-sound/)           |
| Mozart piano works via file                                                                 | [`expirement/mozart-piano-work/`](expirement/mozart-piano-work/) |
| Calculus lessons via file                                                                   | [`expirement/calculus/`](expirement/calculus/)                   |
| Harry Potter Book 1 via file                                                                | [`expirement/story/`](expirement/story/)                         |

We have figured out that, surprisingly, its analysis result given is very similar to humans' EEG in the specific occasion!(In both the old version, v0.0.1. and the current version will output the correct EEG)

## Acknowledgements

Without help of the following people(or not!), I'm not be able to do this project:

1. Deepseek - providing informations about neurology, analysing my `csv`s and find issues for me!
2. My parents - providing electricity, air cond, and food!
3. My sister - providing breathing sounds!
4. Introspection brain - providing patient listenting to those audios!
5. Audio providers(which has already written in the corresponding folder) - providing audios!
   And last but not the least...
6. Every star-giver - Your star is my fuel!

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
