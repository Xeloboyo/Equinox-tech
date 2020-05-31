
const speeddecay= 0.002;


const maxAmmo = 200;
const liquidCapacity = 30;
const ammoMultiplier = 2;
const rotatespeed = 0.5;
const knockback= 2;

const rotcannon = extendContent(Block , "rotary-cannon", {
	//acceptItem(source,item){
    //    return hea;t > 0.5f;
    //},
	shootcone: 20,
	inaccuracy: 10,
	reloadAm: 10,
	recoilAm: 1,
	xRand:0,
	maxAmmo:200,
	range:200,
	
	update(tile){
		
		var ent = tile.entity;
		ent.setSpeed(ent.getSpeed()*(1.0-speeddecay * ((ent.getTarget()==undefined || !this.hasAmmo(tile))?15:1)));
		ent.setLastammoinput(ent.getLastammoinput()+ent.delta());
		
		if(!this.validateTarget(tile)) ent.clearTarget();
		ent.setRecoil( Mathf.lerpDelta(ent.getRecoil(),0,0.1*ent.delta()));
		ent.setHeat( Mathf.lerpDelta(ent.getHeat(),0,0.05*ent.delta()));
		
		if(this.hasAmmo(tile)){
			
            if(ent.getTimer()){
                this.findTarget(tile);
            }
			ent.incrementTimer();
            if(this.validateTarget(tile)){

                var type = this.peekAmmo(tile);
                var speed = type.speed;
                if(speed < 0.1) speed = 9999999.0;

                var result = Predict.intercept(entity, entity.getTarget(), speed);
                if(result.isZero()){
                    result.set(entity.target.getX(), entity.target.getY());
                }

                var targetRot = result.sub(tile.drawx(), tile.drawy()).angle();

                if(Number.isNaN(entity.getRotation())){
                    entity.setRotation(0) ;
                }

                this.turnToTarget(tile, targetRot);

                if(Angles.angleDist(entity.getRotation(), targetRot) < this.shootcone){
                    this.updateShooting(tile);
                }
            }
        }
		
	},
	peekAmmo(tile){
		var ent = tile.entity;
		if(ent.getAmmoType()==Items.thorium){
			return Bullets.standardThorium;
		}
		if(ent.getAmmoType()==Items.lead){
			return Bullets.standardDense;
		}
		if(ent.getAmmoType()==Items.copper){
			return Bullets.standardCopper;
		}
		if(ent.getAmmoType()==Items.pyratite){
			return Bullets.standardIncendiary;
		}
		return Bullets.standardCopper;
	},
	updateShooting(tile){
        var ent = tile.entity;
		if(ent.getReload() >= this.reloadAm){
			while(ent.getReload() >= this.reloadAm && this.hasAmmo(tile)){
				var type = this.peekAmmo(tile);

				this.shoot(tile, type);
				ent.incrementBarrel();
				ent.setReload(ent.getReload()-this.reloadAm);
			}
		}else{
            ent.setReload( ent.getReload()+ent.delta() * this.peekAmmo(tile).reloadMultiplier * this.baseReloadSpeed(tile) * (ent.getSpeed()));
        }
		ent.setSpeed(Math.min(ent.delta()*this.reloadAm*5,ent.getSpeed()+0.03));
    },
	
	baseReloadSpeed(tile){
		var liquid = tile.entity.liquids.current();
		return 0.5+ liquid.heatCapacity*0.3 * Math.min(1.0,tile.entity.liquids.get(liquid)/this.liquidCapacity);
    },
	
	shoot( tile,  type){
        var entity = tile.entity;

        entity.setHeat(entity.getHeat()+0.2);
		var rot = Mathf.sin( Mathf.PI *  (entity.getFrame()*120/9.0 + entity.getBarrel()*120) /180.0  );
        var tr =  new Vec2();
		var tr2 =  new Vec2();
		tr.trns(entity.getRotation(), this.size * Vars.tilesize / 2.0 , Mathf.range(this.xRand));
		tr2.trns(entity.getRotation()+90, rot* Vars.tilesize / 3.0 , 0.0);
		tr = tr.add(tr2);
		
		Bullet.create(type, tile.entity, tile.getTeam(), tile.drawx() + tr.x, tile.drawy() + tr.y, entity.getRotation() + Mathf.range(this.inaccuracy + type.inaccuracy),2.0,0.5);
		
        this.effects(tile,tr);
        this.useAmmo(tile);
    },
	draw(tile){

		Draw.rect(this.baseRegion, tile.drawx(), tile.drawy());

	},
	drawLayer(tile){
        var ent = tile.entity;
		ent.setFrame((Time.time()-ent.getPrevtime())*Math.min(5,ent.getSpeed()*0.4) + ent.getFrame());
		var cframe  = Math.floor(ent.getFrame())%this.animationframes.length;
		this.drawTurretRect(this.animationframes[cframe],tile);
		
		if(ent.heat <= 0.001) return;
		
			Draw.color(Pal.turretHeat, Math.min(2.0,ent.heat));
			Draw.blend(Blending.additive);
			this.drawTurretRect(this.heatanimationframes[cframe],tile);
			Draw.blend();
			Draw.color();	
		ent.setPrevtime (Time.time());	
    },

	drawTurretRect(sprite,tile){
		var entity = tile.entity;
		Draw.rect(
			sprite,
			tile.drawx() + Angles.trnsx(entity.getRotation()+ 180.0, entity.getRecoil() * knockback),
			tile.drawy() + Angles.trnsy(entity.getRotation() + 180.0, entity.getRecoil() * knockback), 
			entity.getRotation() + 90
			);
	},
	drawSelect( tile){
        Drawf.dashCircle(tile.drawx(), tile.drawy(), this.range, tile.getTeam().color);
    },

    drawPlace( x,  y,  rotation,  valid){
        Drawf.dashCircle(x * Vars.tilesize + this.offset(), y * Vars.tilesize + this.offset(), this.range, Pal.placing);
    },
	load(){
		this.super$load();
		this.baseRegion = Core.atlas.find("block-" + 3);
		this.animationframes = [];
		this.heatanimationframes = [];
		for(var i=1;i<=9;i++){
			this.animationframes.push(Core.atlas.find(this.name+"-"+i));
			this.heatanimationframes.push(Core.atlas.find(this.name+"-heat-"+i));
		}
		Log.debug(""+this.animationframes[0]);
		this.layer = Layer.turret;
		this.region = this.animationframes[0];
	},
	
	generateIcons(){
		var processed = [];
		processed.push (Core.atlas.find("block-" + 3));
		processed.push(Core.atlas.find(this.name));
        return processed;
    },
	
	acceptItem(item,tile,source){
		var ent = tile.entity;
		
		return ent.getLastammoinput()>20 && (ent.getAmmoType() === item || ent.getAmmo()==0) && ent.getAmmo()<this.maxAmmo;
		
	},
	handleItem(item,tile,source){
		 var ent = tile.entity;
		 if(ent.getAmmo()==0){
			 ent.setAmmoType(item);
		 }
		 ent.setAmmo(ent.getAmmo()+ammoMultiplier);
		 
		 ent.setLastammoinput(0);
	},
	validateTarget( tile){
        entity = tile.entity;
		if(entity.getTarget()===undefined){return false;}
        return !Units.invalidateTarget(entity.getTarget(), tile.getTeam(), tile.drawx(), tile.drawy());
    },
	findTarget(tile){
        entity = tile.entity;

        entity.setTarget(Units.closestTarget(tile.getTeam(), tile.drawx(), tile.drawy(), this.range, boolf(e => !e.isDead() ) ));
    },
	turnToTarget( tile,  targetRot){
        entity = tile.entity;

        entity.setRotation ( Angles.moveToward(entity.getRotation(), targetRot, rotatespeed * entity.delta() * this.baseReloadSpeed(tile)));
    },
	hasAmmo(tile){
		return tile.entity.getAmmo()>0;
	},
	useAmmo(tile){
		return tile.entity.setAmmo(tile.entity.getAmmo()-1);
	},
	
	effects( tile,tr){
        var entity = tile.entity;

        entity.setRecoil( this.recoilAm);
		var ddd = this.peekAmmo(tile);
		 var shootEffect = ddd.shootEffect ;
        var smokeEffect =  ddd.smokeEffect;

    

        Effects.effect(shootEffect, tile.drawx() + tr.x, tile.drawy() + tr.y, entity.getRotation());
		Effects.effect(smokeEffect, tile.drawx() + tr.x, tile.drawy() + tr.y, entity.getRotation());
		Sounds.shoot.at(tile, Mathf.random(0.9, 1.1));
    },
	
	setStats(){
		this.super$setStats();
		this.stats.add(BlockStat.range, this.range,StatUnit.blocks);
		this.stats.add(BlockStat.booster, new BoosterListValue(this.reloadAm, this.consumes.get(ConsumeType.liquid).amount, 1.0, true, boolf(liquid=>liquid.temperature<=0.5&&liquid.flammability<0.1))); //needs a boolf(liquid)
	},

	setBars(){
        this.super$setBars();

		var func = new Func(){
			get(entity){ 
				return new Bar("blocks.ammo", Pal.ammo, floatp(() => entity.getAmmo() / maxAmmo)); 
			}
		};
        this.bars.add("Ammo",func);
        
    }
	
	
	
});

const coolantfilter = new ConsumeLiquidFilter(boolf(liquid=>liquid.temperature<=0.5&&liquid.flammability<0.1), 0.5 * 1.0);

rotcannon.consumes.add(coolantfilter).update(false);
rotcannon.priority = TargetPriority.turret;

rotcannon.liquidCapacity = 20.0;

rotcannon.entityType=prov(()=>extend(TileEntity,{
	_timer: 0,
		getTimer(){return this._timer==0},
		incrementTimer(){
			this._timer = (this._timer+1)%20;
			},
	_barrel: 0,
		getBarrel(){return this._barrel},
		incrementBarrel(){
			this._barrel = (this._barrel+1)%3;
			},
	_rotation: 0,
		getRotation(){return this._rotation},
		setRotation(sped){this._rotation=sped},		
	_reload: 0,
		getReload(){return this._reload},
		setReload(sped){this._reload=sped},
	_heat:0,
		getHeat(){return this._heat},
		setHeat(sped){this._heat=sped},	
	_recoil: 0,
		getRecoil(){return this._recoil},
		setRecoil(sped){this._recoil=sped},	
	_ammotype: undefined,
		getAmmoType(){return this._ammotype},
		setAmmoType(sped){this._ammotype=sped},			
	_ammo: 0,
		getAmmo(){return this._ammo},
		setAmmo(sped){this._ammo=sped},				
	_frame: 0,
		getFrame(){return this._frame},
		setFrame(sped){this._frame=sped},
	_speed: 0,
		getSpeed(){return this._speed},
		setSpeed(sped){this._speed=sped},
	_prevtime:0,
		getPrevtime(){return this._prevtime},
		setPrevtime(sped){this._prevtime=sped},
	_lastammoinput: 0,
		getLastammoinput(){return this._lastammoinput},
		setLastammoinput(sped){this._lastammoinput=sped},
	_target: undefined,
		getTarget(){return this._target},
		setTarget(sped){this._target=sped},
		clearTarget(){this._target=undefined},		
}));


