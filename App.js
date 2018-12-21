import React from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, FlatList } from 'react-native';
import { createStackNavigator, createAppContainer } from 'react-navigation';

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button
          title="Go to Matches"
          onPress={() => this.props.navigation.navigate('Matches')}
        />
      </View>
    );
  }
}

class MatchesScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: [],
      isMatchesLoading: true,
      isStandingsLoading: true
    }
  }

  getStandings() {
    return fetch('http://api.football-data.org/v2/competitions/2014/standings',
    {
      headers: {
        'X-Auth-Token': '2b235ab73c8a4a8b9cbc541da8ab5191'
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {
      var teams = [];
      for(var i=0; i<responseJson.standings.length; i++) {
        if(responseJson.standings[i].type == 'TOTAL') {
          for(var j=0; j<responseJson.standings[i].table.length; j++) {
            teams.push({
              position: responseJson.standings[i].table[j].position,
              id: responseJson.standings[i].table[j].team.id,
              name: responseJson.standings[i].table[j].team.name,
              crest: responseJson.standings[i].table[j].team.crestUrl,
              played: responseJson.standings[i].table[j].playedGames,
              won: responseJson.standings[i].table[j].won,
              draw: responseJson.standings[i].table[j].draw,
              lost: responseJson.standings[i].table[j].lost,
              points: responseJson.standings[i].table[j].points,
              goalsFor: responseJson.standings[i].table[j].goalsFor,
              goalsAgainst: responseJson.standings[i].table[j].goalsAgainst,
              goalsDiff: responseJson.standings[i].table[j].goalDifference
            });
          }
        }
      }
      this.setState({
        isStandingsLoading: false,
        standingsData: responseJson,
        teams: teams,
      }, function(){

      });
    })
    .catch((error) =>{
      console.error(error);
    });
  }

  getMatches() {
    return fetch('http://api.football-data.org/v2/competitions/2014/matches',
    {
      headers: {
        'X-Auth-Token': '2b235ab73c8a4a8b9cbc541da8ab5191'
      }
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isMatchesLoading: false,
        matchesData: responseJson,
      }, function(){

      });
    })
    .catch((error) =>{
      console.error(error);
    });
  }

  componentDidMount(){
    this.getStandings();
    this.getMatches();
  }

  render() {
    if(this.state.isMatchesLoading || this.state.isStandingsLoading){
      return(
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator/>
        </View>
      )
    }

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FlatList
          data={this.state.matchesData.matches}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                {item.homeTeam.name}
                {item.score.fullTime.homeTeam != null ? (item.score.fullTime.homeTeam) : (<Text>?</Text>)}
                -
                {item.score.fullTime.awayTeam != null ? (item.score.fullTime.awayTeam) : (<Text>?</Text>)}
                {item.awayTeam.name}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'match_'+item.id}
        />
        <Button
          title="Calculate"
          onPress={() => this.props.navigation.navigate('CalculatedTable', {teams: this.state.teams})}
        />
      </View>
    );
  }
}

class CalculatedTableScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      teams: this.props.navigation.getParam('teams', []),
      orderedTeams: []
    }
  }

  compare(a, b) {
    return b.points - a.points
  }

  sortTable() {
    var teams = this.state.teams
    var orderedTeams = teams.sort(this.compare)
    console.log(orderedTeams);
    this.setState({
      orderedTeams: orderedTeams
    }, function(){

    });
  }

  componentDidMount(){
    this.sortTable();
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Calculated Table Screen</Text>
        <FlatList
          data={this.state.teams}
          renderItem={({item}) =>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text>
                {item.name}
              </Text>
            </View>
          }
          keyExtractor={(item, index) => 'team_'+item.id}
        />
      </View>
    );
  }
}

const RootStack = createStackNavigator(
  {
    Home: HomeScreen,
    Matches: MatchesScreen,
    CalculatedTable: CalculatedTableScreen,
  },
  {
    initialRouteName: 'Home',
  }
);

export default createAppContainer(RootStack);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
