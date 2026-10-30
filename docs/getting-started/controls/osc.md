# OSC Messages

## Configuring OSC in the settings
It's possible to edit the port configuration in the settings of the application. Here we can change the **input port**, the **output port**, the **output network address** and the **IP version** to use.
![The settings screen with the OSC configuration](../../_static/images/osc-config.png)

## Message out
Cardew sends message out when a node is selected and using the different interaction modes.

- Navigation
- Rhythmic
- Transition

### Configuring message out
Message out are class dependent, and are configured in the OSC Configuration view, accessible in the sidebar.
Users can select for each class which proeprties to send via OSC, and their order.

![The view with the OSC message out configuration](../../_static/images/osc-config-view.png)
 
The OSC message composer is divided in two parts for each class: the top part contains all of the available properties for a class, the bottom part the selected properties in order that will be sent to the 

## Message in
Cardew can receive messages in through OSC, sending to the predefined port (to edit the OSC port, check settings (LINK Missing))

- **Navigation**: ```/up, /down, /left, /right```
    - From a selected node, navigate to the first node in that direction
- **Position hover**: ```/pos X Y```
    - Given an **X** and **Y** position, select the nodes that are at the declared position.
- **Move node**: ```/move id dimension value```
    - Given a node **id**, the dimension (**x** or **y**) and a position value, move the selected node to the declared position. Interpolation happens at the graph level, to avoid OSC overload.
    **Example**: ```/move node0 x 50.3```

An user can develop and extend these messages by editing the file ```/src/interaction/control.ts``` and create new mappings.