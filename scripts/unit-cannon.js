const somename="wow";
const knockback= 3;
const range = 200;
const rotateSpeed= 0.05;
const basereloadspeed = 0.05;





function create( type,  owner,  team,  x,  y,  angle,  velocityScl,  lifetimeScl,  data){
	var bullet = Pools.obtain(Bullet, prov(()=>extend(Bullet,{
		absorb(){
			this.supressCollision = false;
			this.remove();
		}
		
	})));
	bullet.type = type;
	bullet.owner = owner;
	bullet.data = data;

	bullet.velocity.set(0, type.speed).setAngle(angle).scl(velocityScl);
	if(type.keepVelocity){
		bullet.velocity.add(owner.velocity());
	}

	bullet.team = team;
	bullet.type = type;
	bullet.lifeScl = lifetimeScl;

	bullet.set(x - bullet.velocity.x * Time.delta(), y - bullet.velocity.y * Time.delta());
	bullet.add();

	return bullet;
};
function createUnit(b){
		var data = b.getData();
		return createUnit(data.unit.getType(),data.spawner, b.getTeam(), b.x, b.y);
	};
function createUnit(unit, spawner, team, x ,y){
		if(unit===undefined){
			unit = UnitTypes.crawler;
		}
		var baseunit= unit.create(team);
		baseunit.set(x,y);
		baseunit.add();
		baseunit.setSpawner(spawner);
		Events.fire(new EventType.UnitCreateEvent(baseunit));
		return baseunit;
	};

const unitprojectile = extend(BasicBulletType, {
	
	hit(b,x,y){
		var ax = x===undefined?b.x:x;
		var ay = y===undefined?b.y:y;
		Effects.effect(this.hitEffect, ax, ay, b.rot());
        this.hitSound.at(b);

        Effects.shake(this.hitShake, this.hitShake, b);
		var data = b.getData();
		data.spawnEntity.setBulletlanded(true);
		createUnit(data.unit.getType(),data.spawner, b.getTeam(), ax, ay);
		
	},
	draw(b){
		
		Draw.rect(b.getData().unit.getType().icon(Cicon.full), b.x,b.y);
		
	},
	
	 despawned( b){
		 this.hit(b);
		 
	 }
});
unitprojectile.lifetime = 1;
unitprojectile.drag = 0.00;
unitprojectile.collidesTiles = false;
unitprojectile.splashDamageRadius = 20;
unitprojectile.splashDamage = 20;
unitprojectile.hitEffect = Fx.flakExplosion;
unitprojectile.despawnEffect = Fx.none;
unitprojectile.damage = 1; //Multiply by 12 for dps
unitprojectile.hitSize = 4;
unitprojectile.drawSize = 50;
unitprojectile.speed = 10;

const unitcannon = extendContent(Block, "unit-cannon", {
	//acceptItem(source,item){
    //    return heat > 0.5f;
    //},
	
	update(tile){
		
		var ent = tile.entity;
		var satisfaction = ent.power.graph.getSatisfaction() ;
		ent.setReload(Math.max(0,ent.getReload()-basereloadspeed*satisfaction*ent.delta()));
		
		
		var coolingspeed = 0.005;
		var liquid = ent.liquids.current();
		if(ent.liquids.get(liquid)>0.5){
			coolingspeed *= ((1.0 + (liquid.heatCapacity)))  ;
			if(ent.getHeat()>0.01){
				ent.liquids.remove(liquid,0.5);
			}
		}
		ent.setHeat(Math.max(0,ent.getHeat()-coolingspeed));
		
		this.bulletChk(ent);
		
		if(ent.getTargetTile()!==-1 ){
			var target = Vars.world.tile(ent.getTargetTile());
			if(target==null){
				tile.configure(-1);
				return;
			}
			var targetRotation = tile.angleTo(target);
			ent.setRotation(Mathf.slerpDelta(ent.getRotation(),targetRotation, rotateSpeed *satisfaction));
		}
		
		if(ent.getTargetTile()!==-1 && ent.getBullet()===undefined ){
			
			if(ent.getHasUnit()=== undefined){
				Units.nearby(ent.getTeam(),ent.getX(),ent.getY(),50, 
					cons(
						unit => {
							if(unit.isFlying()||unit instanceof Player){
								return;
							}
							var diff = new Vec2(ent.getX()- unit.getX(),ent.getY()- unit.getY());
							var len2 = diff.len();
							diff.scl(Math.min(2.0,2.0/len2));
							unit.move(diff.getX(),diff.getY());
							
							if(len2<10 && ent.getHasUnit()=== undefined ){
								// : )   you fucked up
								ent.setUnitspawner(unit.getSpawner());
								unit.setSpawner(tile);
								unit.remove();
								
								ent.setHasUnit(unit);
							}
							
						}
						
					)
				);
			}
		
			
			
			if(ent.getHeat()<0.1 && ent.getReload()<0.01 && ent.getHasUnit()!== undefined && Angles.near(ent.getRotation(), targetRotation, 2.0)){
				var lifetime = tile.dst(target)/10.0;
				ent.setReload(1);
				ent.setHeat(Math.min(1,ent.getHeat()+1.0));
				var bullet = Bullet.create(unitprojectile , ent, tile.getTeam(), tile.drawx() , tile.drawy() , ent.getRotation(),1.0,lifetime, 
				{
					unit: ent.getHasUnit(),
					spawner: ent.getUnitspawner(),
					spawnEntity: ent
				});
				ent.setBullet(bullet);
				
			}
		}else{
			ent.setRotation(ent.getRotation()+0.2);
			
		}
		//
		
		
		
		
		
	},
	draw(tile){

		Draw.rect(this.baseRegion, tile.drawx(), tile.drawy());

	},
	drawLayer(tile){
        var entity = tile.entity;
		this.drawTurretRect(this.region,tile);
		
		if(entity.getHeat() <= 0.001) return;
		
			Draw.color(Pal.turretHeat, entity.getHeat());
			Draw.blend(Blending.additive);
			this.drawTurretRect(this.heatRegion,tile);
			Draw.blend();
			Draw.color();	
    },
	
	drawTurretRect(sprite,tile){
		var entity = tile.entity;
		Draw.rect(
			sprite,
			tile.drawx() + Angles.trnsx(entity.getRotation() + 180.0, entity.getReload() * knockback),
			tile.drawy() + Angles.trnsy(entity.getRotation() + 180.0, entity.getReload() * knockback), 
			entity.getRotation() - 90
			);
	},
	removed(tile){
		this.bulletChk(tile.entity);
		this.super$removed(tile);
	},
	
	bulletChk(ent){
		if(ent.getBullet()!=undefined){
			if(ent.getBullet().getGroup()==undefined ){
				if(!ent.getBulletlanded()){
					var unit = createUnit(ent.getHasUnit().getType(),ent.getUnitspawner(),ent.getTeam(),ent.getBullet().x,ent.getBullet().y);
					unit.setSpawner(ent.getUnitspawner());
				}
				ent.clearBullet();
				ent.clearUnit();
				ent.setBulletlanded(false);
			}
		}
		
	},
	
	load(){
		this.super$load();
		this.baseRegion = Core.atlas.find("block-" + 4);
		this.region = Core.atlas.find(this.name);
		this.heatRegion = Core.atlas.find(this.name+"-heat");
		this.layer = Layer.turret;
		
	},
	configured( tile,  player,  value){
		if(tile.entity.getTargetTile!==undefined){
			tile.entity.setTargetTile(value);
		}
    },
	onConfigureTileTapped(tile, other){
        if(tile === other) return false;

        var entity = tile.entity;

        if(entity.getTargetTile() ===other.pos()){
            tile.configure(-1);
            return false;
        }else if(other.dst(tile) <= range ){
            tile.configure(other.pos());
            return false;
        }

        return true;
    },
	drawConfigure(tile){
		var ent = tile.entity;
        var sin = Mathf.absin(Time.time(), 6,1);

        Draw.color(Pal.accent);
        Lines.stroke(1.0);
        Drawf.circles(tile.drawx(), tile.drawy(), (tile.block().size / 2.0 + 1) * Vars.tilesize + sin - 2.0, Pal.accent);

        if(ent.getTargetTile()!==-1){
            var target = Vars.world.tile(ent.getTargetTile());
            Drawf.circles(target.drawx(), target.drawy(), (target.block().size / 2.0 + 1) * Vars.tilesize + sin - 2.0, Pal.place);
            Drawf.arrow(tile.drawx(), tile.drawy(), target.drawx(), target.drawy(), this.size * Vars.tilesize + sin, 4.0 + sin);
        }

        Drawf.dashCircle(tile.drawx(), tile.drawy(), range, Pal.accent);
    },
	generateIcons(){
        return [Core.atlas.find("block-" + 4), Core.atlas.find(this.name)];
    },
	setStats(){
		this.super$setStats();
		this.stats.add(BlockStat.range, range,StatUnit.blocks);
		this.stats.add(BlockStat.booster, new BoosterListValue(1.0, this.consumes.get(ConsumeType.liquid).amount, 1.0, true,  boolf(liquid=>liquid.temperature<=0.5&&liquid.flammability<0.1))); //needs a boolf(liquid)
	},
	init(){
		this.super$init();
		this.consumes.powerCond(100, boolf(entity => entity.getTargetTile() !== -1));
		
	}
	
	

	
});
const coolantfilter = new ConsumeLiquidFilter(boolf(liquid=>liquid.temperature<=0.5&&liquid.flammability<0.1), 0.5 * 1.0);
unitcannon.consumes.add(coolantfilter).update(false);
unitcannon.entityType=prov(()=>extend(TileEntity,{
	
	_heat:0,
		getHeat(){return this._heat},
		setHeat(sped){this._heat=sped},
	_rotation: 0,
		getRotation(){return this._rotation},
		setRotation(sped){this._rotation=sped},
	_reload: 0,
		getReload(){return this._reload},
		setReload(sped){this._reload=sped},
	_targetTile:-1,
		getTargetTile(){return this._targetTile},
		setTargetTile(sped){this._targetTile=sped},
	_bulletlanded:false,
		getBulletlanded(){return this._bulletlanded},
		setBulletlanded(sped){this._bulletlanded=sped},
	_hasUnit: undefined,
		getHasUnit(){return this._hasUnit},
		setHasUnit(sped){this._hasUnit=sped},
		clearUnit(){this._hasUnit=undefined},
	_unitspawner: undefined,
		getUnitspawner(){return this._unitspawner},
		setUnitspawner(sped){this._unitspawner=sped},	
	_bullet: undefined,
		getBullet(){return this._bullet},
		setBullet(sped){this._bullet=sped},	
		clearBullet(){this._bullet=undefined},	
		
	write(stream){
            this.super$write(stream);
            stream.writeInt(this._targetTile);
            stream.writeFloat(this._rotation);
        },

    read( stream,  revision){
            this.super$read(stream, revision);
            this._targetTile = stream.readInt();
            this._rotation = stream.readFloat();
        }	
	
}));





