#!/usr/bin/env python3
"""Render the Chips and Code intro without a browser or external services.

Requires Pillow, NumPy, ffmpeg and the system DejaVu/Nimbus fonts. The original
SVG mark is rasterized through the repository's sharp dependency. The default
output is a SILENT visual master. --audio adds an already authorized narration
file; this script never synthesizes or imitates a voice.
"""
from __future__ import annotations
import argparse, json, math, os, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'static/media'
WIDTH, HEIGHT, SCALE, FPS, DURATION = 1280, 720, 2, 30, 48.0
ACCENT = (79, 70, 229)
LIGHT_ACCENT = (166, 154, 255)
PALETTE = [(7,9,16), (17,21,38), (48,58,87), (166,175,199), (242,241,247)]
FONT_REG = '/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf'
FONT_BOLD = '/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf'
FONT_MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
_font_cache = {}

SEGMENTS = [
    {'start':0.0,'end':4.8,'layer':'signals','title':'Two states.','narration':'Every computer begins with two states. Zero and one.'},
    {'start':4.8,'end':12.2,'layer':'logic','title':'Signals become logic.','narration':'Connect those signals through logic gates, and simple rules become useful behavior.'},
    {'start':12.2,'end':20.2,'layer':'arithmetic','title':'Logic becomes arithmetic.','narration':'Combine gates into arithmetic. Bits become numbers, and circuits add, compare, and calculate.'},
    {'start':20.2,'end':28.2,'layer':'memory','title':'A value can stay.','narration':'Add memory, and the machine can keep its state. A value survives beyond a single moment.'},
    {'start':28.2,'end':36.2,'layer':'architecture','title':'A computer takes shape.','narration':'Bring calculation, memory, and control together. Instructions now move through a complete computer.'},
    {'start':36.2,'end':43.4,'layer':'software','title':'Signals become software.','narration':'Software builds on all of it. Every line of code connects back to the machine beneath.'},
    {'start':43.4,'end':48.0,'layer':'closing','title':'Chips and Code','narration':'Start with logic. Build from the ground up.'},
]
LAYERS = [('00','Signals & logic'),('01','Arithmetic'),('02','Memory'),('03','Architecture'),('04','Software')]


def font(size, mono=False, bold=False):
    key=(size,mono,bold)
    if key not in _font_cache:
        _font_cache[key]=ImageFont.truetype(FONT_MONO if mono else FONT_BOLD if bold else FONT_REG, round(size*SCALE))
    return _font_cache[key]


def lerp(a,b,t): return a+(b-a)*t

def clamp(t): return max(0.0,min(1.0,t))

def ease(t):
    t=clamp(t)
    return t*t*(3-2*t)


def mix(a,b,t): return tuple(round(lerp(x,y,t)) for x,y in zip(a,b))


def rgba(color, alpha=255): return tuple(color[:3])+(round(alpha),)


class Canvas:
    def __init__(self, image, origin=(0,0), scale=1):
        self.im=image
        self.d=ImageDraw.Draw(image)
        self.ox,self.oy=origin
        self.scale=scale
    def pt(self,p): return ((self.ox+p[0]*self.scale)*SCALE,(self.oy+p[1]*self.scale)*SCALE)
    def line(self, points, color, width=1):
        self.d.line([self.pt(p) for p in points], fill=color, width=max(1,round(width*self.scale*SCALE)), joint='curve')
    def box(self,xy,fill=None,outline=None,width=1,radius=0):
        coords=(*self.pt(xy[:2]),*self.pt(xy[2:]))
        if radius:
            self.d.rounded_rectangle(coords,radius=radius*self.scale*SCALE,fill=fill,outline=outline,width=max(1,round(width*SCALE*self.scale)))
        else:self.d.rectangle(coords,fill=fill,outline=outline,width=max(1,round(width*SCALE*self.scale)))
    def poly(self,points,fill=None,outline=None,width=1):
        self.d.polygon([self.pt(p) for p in points],fill=fill)
        if outline:self.line(points+[points[0]],outline,width)
    def circle(self,p,r,fill=None,outline=None,width=1):
        self.box((p[0]-r,p[1]-r,p[0]+r,p[1]+r),fill,outline,width,r)
    def text(self,p,text,size,color,mono=False,bold=False,anchor='la'):
        self.d.text(self.pt(p),text,font=font(size*self.scale,mono,bold),fill=color,anchor=anchor)


def moving_point(points,progress):
    lengths=[math.dist(a,b) for a,b in zip(points,points[1:])]
    distance=sum(lengths)*(progress%1)
    for a,b,length in zip(points,points[1:],lengths):
        if distance <= length:
            t=distance/length if length else 0
            return (lerp(a[0],b[0],t),lerp(a[1],b[1],t))
        distance-=length
    return points[-1]


def trace(c,points,color,progress=None,width=1.8,glow=False):
    if glow:c.line(points,rgba(color,35),width+6)
    c.line(points,rgba(color),width)
    if progress is not None:
        p=moving_point(points,progress)
        c.circle(p,6,rgba(color,35))
        c.circle(p,2.5,rgba(color))


def signal(c,p,value,ink,accent,label=None):
    col=accent if value else mix(ink,(128,132,152),.45)
    c.circle(p,20,rgba(col,22),rgba(col),1.2)
    c.text((p[0],p[1]-1),str(value),19,rgba(ink),True,anchor='mm')
    if label:c.text((p[0],p[1]+32),label,11,rgba(ink,180),True,anchor='ma')


def nand(c,center,ink,accent,out):
    x,y=center
    pts=[(x-50,y-50),(x+5,y-50)]
    pts += [(x+5+50*math.cos(a),y+50*math.sin(a)) for a in np.linspace(-math.pi/2,math.pi/2,30)]
    pts += [(x-50,y+50)]
    c.poly(pts,rgba(accent,22),rgba(ink,190),1.5)
    c.circle((x+63,y),8,rgba(PALETTE[0]),rgba(accent if out else ink),1.8)
    c.text((x-3,y-4),'NAND',20,rgba(ink),True,anchor='mm')
    c.text((x-3,y+20),'a · b',10,rgba(ink,160),True,anchor='mm')


def backdrop(index):
    base=np.array(PALETTE[index],dtype=np.float32)
    y,x=np.mgrid[0:HEIGHT*SCALE,0:WIDTH*SCALE]
    radial=np.exp(-(((x/(WIDTH*SCALE)-.72)/.53)**2+((y/(HEIGHT*SCALE)-.52)/.66)**2)*3)
    # A restrained lens of indigo behind the changing machine.
    delta=np.array([7,5,22],dtype=np.float32) if index<3 else np.array([-9,-9,-1],dtype=np.float32)
    pixels=np.clip(base+radial[:,:,None]*delta,0,255).astype('uint8')
    return Image.fromarray(pixels,'RGB').convert('RGBA')


def plate(c,y,ink,accent,p=0,depth=1,light=False):
    x=820
    w=520
    h=128
    points=[(x-w/2,y),(x,y-h/2),(x+w/2,y),(x,y+h/2)]
    fill=mix(PALETTE[4] if light else PALETTE[1],accent,.13)
    c.poly([(a,b+18) for a,b in points],rgba((0,0,0),20))
    c.poly(points,rgba(fill,130),rgba(ink,60),1)
    c.line([(x-w/2,y),(x,y+h/2),(x+w/2,y)],rgba(accent,160),1.4)
    for i in range(3):
        xx=x+40+i*23
        c.line([(xx,y+h/2-10-i*5),(xx+15,y+h/2-15-i*5)],rgba(ink,110),1.4)


def draw_signals(c,p,ink,accent):
    # One moving observation point, on an exact two-level waveform.
    c.text((640,216),'SIGNAL',12,rgba(ink,150),True)
    pts=[(600,410),(670,410),(670,320),(770,320),(770,410),(875,410),(875,320),(1020,320),(1020,410),(1140,410)]
    c.line([(600,320),(1140,320)],rgba(ink,35))
    c.line([(600,410),(1140,410)],rgba(ink,35))
    trace(c,pts,accent,p*1.4,width=2.3,glow=True)
    c.text((565,314),'1',15,rgba(ink,150),True)
    c.text((565,403),'0',15,rgba(ink,150),True)
    pos=moving_point(pts,p*1.4)
    c.line([(pos[0],275),(pos[0],455)],rgba(ink,90),1)
    c.text((870,484),'0 → 1 → 0',19,rgba(ink),True,anchor='mm')


def draw_logic(c,p,ink,accent):
    case=min(3,int(p*4))
    a,b=[(0,0),(0,1),(1,0),(1,1)][case]
    out=1-(a&b)
    signal(c,(625,305),a,ink,accent,'a')
    signal(c,(625,435),b,ink,accent,'b')
    trace(c,[(645,305),(725,305),(725,345),(770,345)],accent if a else mix(ink,PALETTE[0],.7),p*4)
    trace(c,[(645,435),(725,435),(725,395),(770,395)],accent if b else mix(ink,PALETTE[0],.7),p*4+.3)
    nand(c,(820,370),ink,accent,out)
    trace(c,[(891,370),(1090,370)],accent if out else mix(ink,PALETTE[0],.7),p*4+.6,2.2,bool(out))
    signal(c,(1110,370),out,ink,accent,'out')
    for i,(aa,bb) in enumerate([(0,0),(0,1),(1,0),(1,1)]):
        x=700+i*98
        c.box((x,520,x+78,569),rgba(accent,25 if i==case else 8),rgba(accent if i==case else ink,150 if i==case else 35),1,3)
        c.text((x+39,544),f'{aa}{bb} → {1-(aa&bb)}',13,rgba(ink,255 if i==case else 110),True,anchor='mm')


def draw_arithmetic(c,p,ink,accent):
    a=[0,0,1,1]; b=[0,0,0,1]; sums=[0,1,0,0]
    reveal=min(4,int(p*6))
    c.text((880,228),'0011 + 0001',26,rgba(ink),True,anchor='mm')
    for i in range(4):
        x=660+i*128
        active=i>=4-reveal
        shade=accent if active else mix(ink,PALETTE[1],.7)
        c.text((x-19,287),str(a[i]),16,rgba(ink,230),True,anchor='mm')
        c.text((x+19,287),str(b[i]),16,rgba(ink,230),True,anchor='mm')
        c.line([(x-19,306),(x-19,335)],rgba(shade),1.5)
        c.line([(x+19,306),(x+19,335)],rgba(shade),1.5)
        c.box((x-45,335,x+45,405),rgba(accent,22 if active else 5),rgba(shade),1.5,4)
        c.text((x,362),'ADD',16,rgba(ink,255 if active else 110),True,anchor='mm')
        c.text((x,388),f'bit {3-i}',10,rgba(ink,160),True,anchor='mm')
        if i<3:
            pts=[(x+128-45,375),(x+45,375)]
            trace(c,pts,accent if reveal>3-i else mix(ink,PALETTE[1],.8),p*5)
        c.line([(x,405),(x,458)],rgba(shade),1.5)
        signal(c,(x,480),sums[i] if active else 0,ink,accent)
    c.text((850,560),'0100 = 4',26,rgba(ink,255 if reveal==4 else 80),True,anchor='mm')
    c.text((850,599),'Carry flows from right to left.',12,rgba(ink,160),anchor='mm')


def draw_memory(c,p,ink,accent):
    # The waveform cursor reaches the rising edge after170 of596 path units.
    edge=170/596
    loaded=p>=edge
    bits='10110100' if loaded else '00000000'
    c.text((867,230),'8-BIT REGISTER',14,rgba(ink,180),True,anchor='mm')
    c.text((867,275),'IN  10110100',21,rgba(ink),True,anchor='mm')
    for i,bit in enumerate(bits):
        x=605+i*69
        col=accent if bit=='1' else mix(ink,PALETTE[2],.6)
        c.line([(x+25,310),(x+25,340)],rgba(accent if loaded else ink,150),1.3)
        c.box((x,340,x+50,412),rgba(accent,36 if bit=='1' else 5),rgba(col),1.4,3)
        c.text((x+25,376),bit,29,rgba(ink),True,anchor='mm')
        c.text((x+25,431),str(7-i),10,rgba(ink,170),True,anchor='mm')
    c.line([(598,462),(1135,462)],rgba(ink,80))
    for i in range(8):
        x=630+i*69
        c.line([(x,444),(x,462)],rgba(ink,80))
    clockx=lerp(650,1100,p)
    wave=[(620,554),(790,554),(790,511),(925,511),(925,554),(1130,554)]
    trace(c,wave,accent,p,1.6)
    c.line([(790,490),(790,574)],rgba(ink,80),1)
    c.text((598,528),'CLK',11,rgba(ink,180),True,anchor='rm')
    c.text((870,605),'HOLD  10110100' if loaded else 'WAITING FOR THE CLOCK',14,rgba(ink),True,anchor='mm')
    if edge <= p <= edge+.17:
        a=(1-(p-edge)/.17)*150
        c.box((592,329,1155,425),None,rgba(accent,a),2,6)


def block(c,box,label,ink,accent,sub=None,active=False):
    c.box(box,rgba(accent,28 if active else 9),rgba(accent if active else ink,180 if active else 80),1.5,4)
    x=(box[0]+box[2])/2;y=(box[1]+box[3])/2
    c.text((x,y-(10 if sub else 0)),label,17,rgba(ink),True,anchor='mm')
    if sub:c.text((x,y+20),sub,12,rgba(ink,185),True,anchor='mm')


def draw_architecture(c,p,ink,accent):
    stage=0 if p<.26 else 1 if p<.5 else 2 if p<.76 else 3
    c.box((590,300,980,574),rgba((255,255,255),20),rgba(ink,110),1.5,5)
    c.text((614,316),'CPU',13,rgba(ink,170),True)
    block(c,(1012,221,1182,293),'PROGRAM',ink,accent,'D = D + A',stage==0)
    block(c,(612,365,734,431),'CONTROL',ink,accent,None,stage==1)
    block(c,(778,365,947,451),'ALU',ink,accent,'3 + 1 = 4',stage==2)
    block(c,(674,489,786,550),'A = 1',ink,accent)
    block(c,(830,489,947,550),'D = '+('4' if stage==3 else '3'),ink,accent,None,stage==3)
    paths=[[(1097,293),(1097,337),(673,337),(673,365)],[(734,398),(778,398)],[(730,489),(730,470),(816,470),(816,451)],[(888,451),(888,489)]]
    for i,pts in enumerate(paths):trace(c,pts,accent if i==stage else mix(ink,PALETTE[3],.65),p*4+i/4 if i==stage else None,2 if i==stage else 1.3)
    c.text((867,615),['FETCH','DECODE','EXECUTE','WRITE BACK'][stage],14,rgba(ink),True,anchor='mm')


def draw_software(c,p,ink,accent):
    c.box((571,219,1190,518),rgba((255,255,255),130),rgba(ink,55),1.2,6)
    c.line([(571,262),(1190,262)],rgba(ink,40),1)
    c.text((597,237),'main.js',12,rgba(ink,160),True)
    for i,col in enumerate([accent,mix(accent,(255,255,255),.4),mix(accent,(255,255,255),.7)]):c.circle((1135+i*16,241),3,rgba(col))
    lines=[('function add(a, b) {',accent),('  return a + b;',ink),('}',ink),('',ink),('add(3, 1);',accent)]
    for i,(txt,col) in enumerate(lines):
        alpha=255 if p>(i*.07) else round(100+155*clamp(p/(i*.07+.01)))
        c.text((600,292+i*35),f'{i+1:2}',12,rgba(ink,85),True)
        c.text((643,288+i*35),txt,21,rgba(col,alpha),True)
    if p>.43:
        q=ease((p-.43)/.17)
        c.line([(892,518),(892,548)],rgba(accent,q*230),1.8)
        c.box((786,548,998,608),rgba(accent,q*20),rgba(accent,q*170),1.3,4)
        c.text((892,578),'4',34,rgba(accent,q*255),True,anchor='mm')


def draw_stack(c,p,ink,accent):
    # Actual abstraction order: hardware at the bottom, software above it.
    labels=['Software','Architecture','Memory','Arithmetic','Logic']
    colors=[(242,241,247),(166,175,199),(48,58,87),(17,21,38),(7,9,16)]
    reveal=ease(min(1,p*2.3))
    for i in reversed(range(5)):
        y=245+i*(56+12*reveal)
        cx=855
        pts=[(cx-230,y),(cx,y-61),(cx+230,y),(cx,y+61)]
        top=colors[i]
        c.poly([(x,yy+14) for x,yy in pts],rgba(mix(top,(0,0,0),.24)),None)
        c.poly(pts,rgba(top),rgba(accent,100),1)
        c.line([(cx-230,y),(cx,y+61),(cx+230,y)],rgba(accent,170),1.5)
        localink=(39,41,68) if i<2 else (179,173,237)
        for j in range(4):
            x=cx-100+j*43
            c.line([(x,y-12),(x+25,y-20),(x+76,y-5),(x+51,y+3)],rgba(localink,100),1)
        c.text((1143,y-2),labels[i],12,rgba(ink,200),anchor='lm')
        c.line([(cx+234,y),(1128,y)],rgba(ink,65),1)


def add_common(c,t,layer_idx,ink,accent,mark):
    # Quiet framing and a truthful abstraction rail, not dashboard decoration.
    c.im.alpha_composite(mark,(round(58*SCALE),round(39*SCALE)))
    c.text((102,46),'Chips and Code',18,rgba(ink),bold=True)
    c.line([(58,96),(1222,96)],rgba(ink,35),1)
    c.text((1222,52),'FROM SIGNAL TO SOFTWARE',10,rgba(ink,145),True,anchor='ra')
    y=116
    railwidth=1164
    for i,(number,name) in enumerate(LAYERS):
        x=58+i*railwidth/5
        active=(i==layer_idx)
        c.line([(x,y),(x+railwidth/5-20,y)],rgba(accent if active else ink,200 if active else 40),2 if active else 1)
        c.text((x,y+13),number+'  '+name,10,rgba(ink,240 if active else 130),True)


def get_scene(t):
    return next((i for i,s in enumerate(SEGMENTS) if t<s['end']),len(SEGMENTS)-1)


def render_scene(idx,p,t,ink,accent,mark):
    layer=Image.new('RGBA',(WIDTH*SCALE,HEIGHT*SCALE))
    # A slow push in during each shot; anchored to the machine, not the typography.
    drift=1+0.018*ease(p)
    c=Canvas(layer,origin=(850*(1-drift),390*(1-drift)),scale=drift)
    functions=[draw_signals,draw_logic,draw_arithmetic,draw_memory,draw_architecture,draw_software,draw_stack]
    functions[idx](c,p,ink,accent)
    tc=Canvas(layer)
    if idx==0:
        tc.text((58,234),'THE FOUNDATION',11,rgba(accent),True)
        tc.text((58,280),'Two states.',59,rgba(ink),bold=False)
        tc.text((58,357),'Zero. One.',34,rgba(ink,190))
    elif idx==6:
        tc.text((58,234),'BUILD FROM THE GROUND UP',11,rgba(accent),True)
        tc.text((58,282),'Chips and Code',46,rgba(ink),bold=True)
        tc.text((58,354),'Start with logic.',31,rgba(accent))
        tc.text((58,418),'Wire a circuit. Or write its code.',17,rgba(ink,170))
    else:
        layer_idx=idx-1
        tc.text((58,230),'LAYER '+LAYERS[layer_idx][0],11,rgba(accent),True)
        titles=[['Signals','become logic.'],['Logic becomes','arithmetic.'],['A value','can stay.'],['A computer','takes shape.'],['Signals become','software.']]
        for n,line in enumerate(titles[layer_idx]):tc.text((58,277+n*62),line,52,rgba(ink))
        subtitles=['Define behavior with gates.','Compute with binary values.','Keep state between clock edges.','Execute an instruction.','Raise the level of abstraction.']
        tc.text((58,432),subtitles[layer_idx],16,rgba(ink,165))
    return layer


def timestamp(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'


def metadata():
    OUT.mkdir(parents=True,exist_ok=True)
    data={'title':'Chips and Code — from signal to software','duration':DURATION,'fps':FPS,'width':WIDTH,'height':HEIGHT,'audio_status':'silent-master-awaiting-narration','voice_direction':'Natural, clear English. Calm, precise, curious. About 110 words per minute. No theatrical emphasis. Leave breathing room between layers.','segments':SEGMENTS,'visual_accuracy':{'logic':'All four NAND input cases; out = NOT(a AND b).','arithmetic':'Four-bit addition:0011 +0001 =0100.','memory':'Eight-bit register loads10110100 on a rising edge, then holds it.','architecture':'Conceptual fetch/decode/execute/write-back: D=D+A with D=3,A=1 produces D=4.','software':'Conceptual high-level add(3,1) returns4; this software layer is a roadmap, not a current programming exercise.'}}
    (OUT/'computer-intro-timing.json').write_text(json.dumps(data,indent=2)+'\n')
    captions='WEBVTT\n\n'+''.join(f'{n+1}\n{timestamp(s["start"]+.15)} --> {timestamp(s["end"]-.1)} line:88% position:50% size:85% align:center\n{s["narration"]}\n\n' for n,s in enumerate(SEGMENTS))
    (OUT/'computer-intro.vtt').write_text(captions)
    (OUT/'computer-intro-transcript.txt').write_text('Chips and Code — from signal to software\n\n'+ '\n\n'.join(s['narration'] for s in SEGMENTS)+'\n')


def prepare_mark():
    path=OUT/'computer-intro-mark.png'
    subprocess.run(['node','-e',"require('sharp')('static/logo.svg').resize(96,96).png().toFile('static/media/computer-intro-mark.png')"],cwd=ROOT,check=True)
    image=Image.open(path).convert('RGBA').resize((32*SCALE,32*SCALE),Image.Resampling.LANCZOS)
    path.unlink()
    return image


def frame_at(t,backgrounds,mark):
    idx=get_scene(t);segment=SEGMENTS[idx]
    p=clamp((t-segment['start'])/(segment['end']-segment['start']))
    current_palette=max(0,min(4,idx-1))
    previous_palette=max(0,min(4,idx-2))
    transition=ease((t-segment['start'])/1.15) if idx else ease(t/.8)
    bg=Image.blend(backgrounds[previous_palette],backgrounds[current_palette],transition) if idx else backgrounds[0].copy()
    ink=(236,236,247) if current_palette<3 else (27,30,54)
    accent=LIGHT_ACCENT if current_palette<3 else ACCENT
    if idx and transition<1:
        oldink=(236,236,247) if previous_palette<3 else (27,30,54)
        oldaccent=LIGHT_ACCENT if previous_palette<3 else ACCENT
        previous=render_scene(idx-1,1,t,oldink,oldaccent,mark)
        previous.putalpha(previous.getchannel('A').point(lambda a:round(a*(1-transition))))
        bg.alpha_composite(previous)
    scene=render_scene(idx,p,t,ink,accent,mark)
    if transition<1:scene.putalpha(scene.getchannel('A').point(lambda a:round(a*transition)))
    bg.alpha_composite(scene)
    # Fade framing only at the film opening; layer controls never jump.
    compositeink=mix((236,236,247) if previous_palette<3 else (27,30,54),ink,transition)
    compositeaccent=mix(LIGHT_ACCENT if previous_palette<3 else ACCENT,accent,transition)
    framing=Image.new('RGBA',bg.size)
    add_common(Canvas(framing),t,current_palette,compositeink,compositeaccent,mark)
    bg.alpha_composite(framing)
    if t<.7:
        black=Image.new('RGBA',bg.size,PALETTE[0]+(255,));bg=Image.blend(black,bg,ease(t/.7))
    return bg.convert('RGB').resize((WIDTH,HEIGHT),Image.Resampling.LANCZOS)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--audio',type=Path,help='Optional finished narration file. It must fit the timed48-second film.')
    parser.add_argument('--stills-only',action='store_true')
    parser.add_argument('--start',type=float,default=0.0,help='Render a time range for motion review.')
    parser.add_argument('--end',type=float,default=DURATION,help='End of an optional review range.')
    parser.add_argument('--output',type=Path,default=OUT/'computer-intro.mp4')
    args=parser.parse_args()
    if not 0 <= args.start < args.end <= DURATION:
        parser.error('Require0 <= start < end <=48.')
    if args.audio and (args.start != 0 or args.end != DURATION):
        parser.error('Audio muxing requires the complete film.')
    metadata()
    mark=prepare_mark()
    backgrounds=[backdrop(i) for i in range(5)]
    framesdir=Path(os.environ.get('INTRO_REVIEW_DIRECTORY',str(ROOT.parent/'intro-review')))
    framesdir.mkdir(exist_ok=True)
    for second in [2.5,8.3,16.8,25.6,33.5,40.8,46.2]:
        frame_at(second,backgrounds,mark).save(framesdir/f'frame-{second:04.1f}.jpg',quality=94)
    # Poster shows the complete abstraction stack using the real brand mark.
    frame_at(46.2,backgrounds,mark).save(OUT/'computer-intro-poster.jpg',quality=94)
    if args.stills_only:
        print(f'Review frames: {framesdir}',flush=True);return
    master=args.output if not args.audio else args.output.with_name(args.output.stem+'-silent.mp4')
    command=['ffmpeg','-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{WIDTH}x{HEIGHT}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','22','-profile:v','high','-level','3.1','-pix_fmt','yuv420p','-movflags','+faststart',str(master)]
    process=subprocess.Popen(command,stdin=subprocess.PIPE)
    try:
        for n in range(round((args.end-args.start)*FPS)):
            process.stdin.write(frame_at(args.start+n/FPS,backgrounds,mark).tobytes())
            if n%300==0:print(f'Rendered {args.start+n/FPS:.1f} / {args.end:.1f} seconds',flush=True)
        process.stdin.close()
        if process.wait()!=0:raise RuntimeError('ffmpeg failed')
    except BaseException:
        process.kill();raise
    if args.audio:
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','warning','-y','-i',str(master),'-i',str(args.audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=7,apad','-t',str(DURATION),'-movflags','+faststart',str(args.output)],check=True)
        data=json.loads((OUT/'computer-intro-timing.json').read_text());data['audio_status']='narrated';(OUT/'computer-intro-timing.json').write_text(json.dumps(data,indent=2)+'\n')
        master.unlink()
    print(f'Film: {args.output} ({args.output.stat().st_size/1e6:.2f} MB)',flush=True)


if __name__=='__main__':main()
