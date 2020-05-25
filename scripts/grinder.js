const somename="wow";
const heatneeded= 0.3;
const grinder = extendContent(Block, "grinder", {
	//acceptItem(source,item){
    //    return heat > 0.5f;
    //},
	
	update(tile){
		
		var ent = tile.entity;
		if(ent.getSpeed()===undefined){
			ent.setSpeed(0);
		}
		if(ent.power.graph.getSatisfaction() > 0.2){
			ent.setSpeed(Mathf.lerpDelta(ent.getSpeed(), 1, 0.003));
		}else{
			ent.setSpeed(Mathf.lerpDelta(ent.getSpeed(), 0, 0.01));
		}	
		ent.setBuiltupheat( Math.min(1.0,ent.getBuiltupheat()+ent.getSpeed()*0.2));
		//this.builtupheat = 0.5;
		if(ent.getBuiltupheat()>heatneeded && tile.entity.items.total()>0 && tile.entity.items.get(Items.scrap)<10){
			
			var item = tile.entity.items.take();
			if(item == Items.scrap){
				tile.entity.items.add(item, 1);
			}else{
				ent.setBuiltupmats(ent.getBuiltupmats()+ Mathf.random(0,1));
				ent.setBuiltupheat(ent.getBuiltupheat()-heatneeded);
				
				if(Mathf.random(0,1)<0.2){
					Effects.effect(Fx.fuelburn,(tile));
				}
			}
		}
		while(this.tryDump(tile,Items.scrap)){}
		while(ent.getBuiltupmats()>1 && tile.entity.items.get(Items.scrap)<10){
			this.offloadNear(tile,Items.scrap);
			ent.setBuiltupmats(ent.getBuiltupmats()-1);
			
		}
		
	},
	draw(tile){
		var ent = tile.entity;
		//Time.time()%this.frames.length
		ent.setFrame((Time.time()-ent.getPrevtime())*ent.getSpeed() + ent.getFrame());
		Draw.rect(this.animationframes[Math.floor(ent.getFrame())%this.animationframes.length], tile.drawx(), tile.drawy());
		//animationframes[Time.time()%this.animationframes.length]
		
		ent.setPrevtime (Time.time());
	},
	load(){
		this.super$load();
		this.animationframes = [];
		for(var i=1;i<9;i++){
			this.animationframes.push(Core.atlas.find(this.name+"-"+i));
		}
		Log.debug(""+this.animationframes[0]);
		this.region = this.animationframes[0];
		
	},
	acceptItem(item,tile,source){
		return tile.entity.items.get(item)<5;
		
	},
	handleItem(item,tile,source){
		tile.entity.items.add(item, 1);
	},
	
});

grinder.entityType=prov(()=>extend(TileEntity,{
	_frame: 0,
		getFrame(){return this._frame},
		setFrame(sped){this._frame=sped},
	_speed: 0,
		getSpeed(){return this._speed},
		setSpeed(sped){this._speed=sped},
	_builtupheat:0,
		getBuiltupheat(){return this._builtupheat},
		setBuiltupheat(sped){this._builtupheat=sped},
	_builtupmats:0,
		getBuiltupmats(){return this._builtupmats},
		setBuiltupmats(sped){this._builtupmats=sped},
	_prevtime:0,
		getPrevtime(){return this._prevtime},
		setPrevtime(sped){this._prevtime=sped}
	
}));


