import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import profiles from '@/data/aircraft-profiles.json';
import {collectionAchievements,discoveryDeck,makeQuiz,quizPool,quizScore,recordGuess} from '@/lib/play.mjs';
import type {Entry,Flight,Photo} from '@/lib/types';
import {Icon} from './icons';

type Activity='quiz'|'discovery'|'achievements';
type Question={photo:Photo;model:string;answer:string;options:string[];profile:{description:string;source:string}};
type Award={key:string;title:string;description:string;current:number;target:number;missing:string[];photoIds:string[];unlocked:boolean};
type OpenPhotos=(ids:string[],index:number,onNavigate?:()=>void)=>void;
const asset=(path:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}${path}`;

function PlayDialog({title,eyebrow,children,onClose}:{title:string;eyebrow:string;children:ReactNode;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{
    const el=dialog.current!,previous=document.activeElement as HTMLElement|null;
    el.showModal();heading.current?.focus({preventScroll:true});
    return()=>{el.close();previous?.focus({preventScroll:true});};
  },[]);
  return <dialog ref={dialog} className="play-dialog" aria-labelledby="play-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <header className="play-dialog-head"><div><span className="eyebrow">{eyebrow}</span><h2 id="play-title" ref={heading} tabIndex={-1}>{title}</h2></div><button className="icon-button" aria-label="关闭飞友互动" onClick={onClose}><Icon name="close" size={23}/></button></header>
    {children}
  </dialog>;
}

function GamePhoto({photo,alt,scan=false,onReady}:{photo:Photo;alt:string;scan?:boolean;onReady?:(ready:boolean)=>void}) {
  const [status,setStatus]=useState('loading'),[attempt,setAttempt]=useState(0);
  return <div className={`game-photo ${scan?'with-radar':''}`} data-ready={status==='ready'}>
    <img key={attempt} src={`${asset(photo.image)}${attempt?`?retry=${attempt}`:''}`} alt={alt} onLoad={()=>{setStatus('ready');onReady?.(true);}} onError={()=>{setStatus('error');onReady?.(false);}}/>
    {status==='loading'&&<div className="game-photo-status" role="status"><Icon name="camera" size={25}/><span>正在加载照片…</span></div>}
    {status==='error'&&<div className="game-photo-status" role="alert"><span>照片暂时没能加载</span><button onClick={()=>{setStatus('loading');setAttempt(n=>n+1);onReady?.(false);}}>重新加载图片</button></div>}
    {status==='ready'&&scan&&<div className="radar-reveal" aria-hidden="true"><div className="radar-disc"><i/><b/><span><Icon name="aircraft" size={28}/></span></div></div>}
  </div>;
}

function Quiz({aircraft,photos,onPhotos}:{aircraft:Entry[];photos:Photo[];onPhotos:OpenPhotos}) {
  const pool=useMemo(()=>quizPool(aircraft,photos,profiles.families),[aircraft,photos]);
  const [questions,setQuestions]=useState(()=>makeQuiz(pool) as Question[]);
  const [answers,setAnswers]=useState<(string|null)[]>(()=>questions.map(()=>null));
  const [index,setIndex]=useState(0),[finished,setFinished]=useState(false),[imageReady,setImageReady]=useState(false);
  const questionHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{questionHeading.current?.focus({preventScroll:false});},[index,finished]);
  const restart=()=>{const round=makeQuiz(pool) as Question[];setQuestions(round);setAnswers(round.map(()=>null));setIndex(0);setFinished(false);setImageReady(false);};
  if(!questions.length)return <p className="play-empty">暂时没有足够的已确认照片来出题。</p>;
  const question=questions[index],answer=answers[index],score=quizScore(questions,answers);
  if(finished)return <div className="quiz-results">
    <div className="quiz-score"><span className="eyebrow">ROUND COMPLETE</span><strong>{score}<small> / {questions.length}</small></strong><h3 ref={questionHeading} tabIndex={-1}>{score===questions.length?'识机达人，全对！':'又多认识了几位天空朋友。'}</h3><p>点击照片，可以继续查看具体型号与拍摄细节。</p></div>
    <div className="quiz-review">{questions.map((q,i)=><button key={q.photo.id} onClick={()=>onPhotos(questions.map(item=>item.photo.id),i)}><img src={asset(q.photo.thumbnail)} alt=""/><span><strong><Icon name={answers[i]===q.answer?'check':'close'} size={15}/>{q.answer}</strong><small>{q.model} · {answers[i]===q.answer?'答对了':`你选了 ${answers[i]}`}</small></span><Icon name="diagonal" size={16}/></button>)}</div>
    <button className="play-primary" onClick={restart}><Icon name="play" size={16}/>再玩一轮</button>
  </div>;
  return <div className="quiz-body">
    <div className="quiz-progress"><span>第 {index+1} / {questions.length} 题</span><span>已答对 {score} 题</span></div>
    <h3 className="quiz-question" ref={questionHeading} tabIndex={-1}>这是哪个机型家族或系列？</h3>
    <GamePhoto key={question.photo.id} photo={question.photo} alt={answer?`${question.model}，${question.photo.airlines.join(' / ')}`:`第 ${index+1} 题：请观察照片中的飞机`} onReady={setImageReady}/>
    <div className="quiz-choices" role="group" aria-label="选择机型答案">{question.options.map((option,i)=><button key={option} disabled={!imageReady} aria-disabled={answer!==null} aria-pressed={answer===option} className={`${answer&&option===question.answer?'is-correct':''} ${answer===option&&option!==question.answer?'is-wrong':''}`} onClick={()=>setAnswers(previous=>recordGuess(questions,previous,index,option))}>
      <span className="choice-letter">{'ABCD'[i]}</span><span>{option}</span>{answer&&option===question.answer?<span className="choice-result"><Icon name="check" size={15}/>正确答案</span>:answer===option?<span className="choice-result"><Icon name="close" size={15}/>你的选择</span>:null}
    </button>)}</div>
    {answer?<div className="quiz-answer" role="status"><h4>{answer===question.answer?'答对了！':`正确答案是 ${question.answer}`}</h4><p className="quiz-photo-label">照片中的飞机：{question.model} · {question.photo.airlines.join(' / ')||'Private / Business'}</p><p>{question.profile.description}</p><a href={question.profile.source} target="_blank" rel="noreferrer">制造商资料 <Icon name="diagonal" size={12}/></a></div>:<p className="play-note">每轮 5 题，按家族／系列作答；揭晓后显示具体子型号。无需计时，慢慢看。</p>}
    <div className="quiz-next"><span>{answer?'记住这个轮廓，下次机场见。':'选择一个答案后揭晓'}</span><button className="play-primary" disabled={!answer} onClick={()=>{if(index===questions.length-1)setFinished(true);else{setImageReady(false);setIndex(i=>i===index?i+1:i);}}}>{index===questions.length-1?'查看成绩':'下一题'}<Icon name="arrow" size={17}/></button></div>
  </div>;
}

function Discovery({photos,onPhotos}:{photos:Photo[];onPhotos:OpenPhotos}) {
  const [draw,setDraw]=useState(()=>({deck:discoveryDeck(photos) as Photo[],index:0}));
  const {deck,index}=draw;
  const photo=deck[index];
  if(!photo)return <p className="play-empty">暂时没有可展示的照片。</p>;
  const next=()=>setDraw(current=>current.index+1>=current.deck.length?{deck:discoveryDeck(photos,current.deck[current.index].id),index:0}:{...current,index:current.index+1});
  return <div className="discovery-body">
    <div className="discovery-top"><span><i/> TODAY’S ENCOUNTER</span><span>本轮第 {index+1} 张 / {deck.length}</span></div>
    <GamePhoto key={photo.id} photo={photo} alt={`${photo.models.join(' / ')} · ${photo.airlines.join(' / ')}`} scan/>
    <div className="discovery-info" aria-live="polite"><span className="eyebrow">{photo.airlines.join(' / ')||'PRIVATE / BUSINESS'}</span><h3>{photo.models.join(' / ')}</h3><div className="discovery-facts"><span><Icon name="pin" size={14}/>{photo.airport}</span><span><Icon name="calendar" size={14}/>{photo.date}</span><span>注册号 {photo.registration?`${photo.registration.value}${photo.registration.status==='confirmed'?'':' · 推测'}`:'待确认'}</span></div><p>{photo.livery} · 摄影 Yuan Wang</p></div>
    <div className="discovery-actions"><button className="play-secondary" onClick={()=>onPhotos([photo.id],0)}>查看照片与机型档案<Icon name="diagonal" size={15}/></button><button className="play-primary" onClick={next}><Icon name="radar" size={17}/>再遇见一架</button></div>
    <p className="play-note">来自自己的拍摄收藏，同一轮里每张照片只出现一次。</p>
  </div>;
}

function Achievements({awards,photos,onPhotos}:{awards:Award[];photos:Photo[];onPhotos:OpenPhotos}) {
  const [selected,setSelected]=useState(awards[0].key);
  const detail=useRef<HTMLElement>(null);
  const award=awards.find(a=>a.key===selected)!;
  const byId=new Map(photos.map(p=>[p.id,p]));
  return <div className="awards-body"><div className="awards-intro"><Icon name="award" size={34}/><div><strong>{awards.filter(a=>a.unlocked).length} / {awards.length} 枚成就已解锁</strong><p>每一枚，都有你自己的照片作证。</p></div></div>
    <div className="award-grid" aria-label="航空收藏成就">{awards.map(a=><button key={a.key} className={`award-card ${a.unlocked?'is-unlocked':''}`} aria-pressed={selected===a.key} aria-controls="achievement-detail" onClick={()=>{setSelected(a.key);detail.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}><span className="award-symbol"><Icon name={a.unlocked?'award':'lock'} size={25}/></span><strong>{a.title}</strong><span>{a.unlocked?'已解锁':`${a.current} / ${a.target} · 进行中`}</span><progress value={Math.min(a.current,a.target)} max={a.target} aria-label={`${a.title} ${Math.min(a.current,a.target)} / ${a.target}`}/></button>)}</div>
    <section ref={detail} id="achievement-detail" className="award-detail" aria-live="polite"><div className="award-detail-heading"><div><span className="eyebrow">{award.unlocked?'COLLECTED':'NEXT ON YOUR RADAR'}</span><h3>{award.title}</h3></div><span>{Math.min(award.current,award.target)} / {award.target}</span></div><p>{award.description}</p>{award.missing.length>0&&<p className="award-missing">还差：{award.missing.join('、')}</p>}
      {award.photoIds.length>0?<><div className="award-photos">{award.photoIds.slice(0,4).map((id,i)=>{const p=byId.get(id)!;return <button key={id} onClick={()=>onPhotos(award.photoIds,i)} aria-label={`查看成就照片 ${p.id}，${p.models.join(' / ')}`}><img src={asset(p.thumbnail)} alt={p.models.join(' / ')} loading="lazy"/></button>;})}</div><button className="play-secondary" onClick={()=>onPhotos(award.photoIds,0)}>查看关联照片 · {award.photoIds.length} 张<Icon name="arrow" size={15}/></button></>:<p className="play-note">还没有符合条件的照片，留给下一次相遇。</p>}
    </section><p className="play-note">成就根据当前图鉴自动计算；“拍过，也坐过”只采用已确认的注册号匹配。</p>
  </div>;
}

export function AviationPlayground({aircraft,airlines,photos,flights,onPhotos}:{aircraft:Entry[];airlines:Entry[];photos:Photo[];flights:Flight[];onPhotos:OpenPhotos}) {
  const [active,setActive]=useState<Activity|null>(null);
  const awards=useMemo(()=>collectionAchievements(aircraft,airlines,photos,flights) as Award[],[aircraft,airlines,photos,flights]);
  const showPhotos:OpenPhotos=(ids,index)=>onPhotos(ids,index,()=>setActive(null));
  const activities=[{id:'quiz',icon:'quiz',title:'猜机型',subtitle:'5 张照片，试试你的眼力',english:'SPOTTER CHALLENGE'},{id:'discovery',icon:'radar',title:'随机遇见一架',subtitle:'让雷达带你发现一张照片',english:'ON YOUR RADAR'},{id:'achievements',icon:'award',title:'航空收藏成就',subtitle:`${awards.filter(a=>a.unlocked).length} / ${awards.length} 枚成就已解锁`,english:'COLLECTION ACHIEVEMENTS'}] as const;
  const current=activities.find(a=>a.id===active);
  return <><section className="aviation-playground" aria-label="飞友互动">{activities.map(a=><button className="play-launch" key={a.id} onClick={()=>setActive(a.id)}><span className="play-launch-icon"><Icon name={a.icon} size={23}/></span><span><strong>{a.title}</strong><small>{a.subtitle}</small></span><Icon name="arrow" size={17}/></button>)}</section>
    {active&&current&&<PlayDialog title={current.title} eyebrow={current.english} onClose={()=>setActive(null)}>{active==='quiz'?<Quiz aircraft={aircraft} photos={photos} onPhotos={showPhotos}/>:active==='discovery'?<Discovery photos={photos} onPhotos={showPhotos}/>:<Achievements awards={awards} photos={photos} onPhotos={showPhotos}/>}</PlayDialog>}
  </>;
}
